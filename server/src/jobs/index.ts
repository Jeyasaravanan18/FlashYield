import cron from 'node-cron';
import { Listing } from '../models/Listing';
import { Claim } from '../models/Claim';
import { emitListingExpired } from '../socket/emitter';
import { logger } from '../utils/logger';

let expireListingsTask: cron.ScheduledTask | null = null;
let cleanupClaimsTask: cron.ScheduledTask | null = null;

/**
 * Start all cron jobs.
 */
export function startCronJobs(): void {
  // Run every minute: expire active listings whose claim window has closed
  expireListingsTask = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expiredListings = await Listing.find({
        status: 'active',
        claimWindowEnd: { $lte: now },
      });

      if (expiredListings.length > 0) {
        await Listing.updateMany(
          {
            status: { $in: ['active', 'sold_out'] },
            claimWindowEnd: { $lte: now },
          },
          { $set: { status: 'expired' } },
        );

        // Emit expiry events
        for (const listing of expiredListings) {
          emitListingExpired(listing._id.toString());
        }

        logger.info(
          { count: expiredListings.length },
          'Expired listings via cron',
        );
      }
    } catch (err) {
      logger.error({ err }, 'Error in expire-listings cron');
    }
  });

  // Run every 5 minutes: expire uncollected claims past their expiry
  cleanupClaimsTask = cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // First, find the claims that are about to be expired (capture their IDs)
      const claimsToExpire = await Claim.find({
        status: 'reserved',
        expiresAt: { $lte: now },
      }).select('_id listingId');

      if (claimsToExpire.length === 0) return;

      const claimIds = claimsToExpire.map((c) => c._id);

      // Mark only these specific claims as expired
      await Claim.updateMany(
        { _id: { $in: claimIds } },
        { $set: { status: 'expired' } },
      );

      logger.info(
        { count: claimsToExpire.length },
        'Expired stale claims via cron',
      );

      // Restore quantities only for the claims we just expired
      const listingIncrements = new Map<string, number>();
      for (const claim of claimsToExpire) {
        const key = claim.listingId.toString();
        listingIncrements.set(key, (listingIncrements.get(key) || 0) + 1);
      }

      for (const [listingId, increment] of listingIncrements) {
        await Listing.findOneAndUpdate(
          {
            _id: listingId,
            status: { $in: ['active', 'sold_out'] },
            claimWindowEnd: { $gt: now },
          },
          {
            $inc: { quantityAvailable: increment },
            $set: { status: 'active' },
          },
        );
      }
    } catch (err) {
      logger.error({ err }, 'Error in cleanup-claims cron');
    }
  });

  logger.info('Cron jobs started');
}

/**
 * Stop all cron jobs gracefully.
 */
export function stopCronJobs(): void {
  expireListingsTask?.stop();
  cleanupClaimsTask?.stop();
  logger.info('Cron jobs stopped');
}
