import { logger } from '../utils/logger';

/**
 * Emit listing update events to all clients subscribed to a listing room.
 * Decoupled from the Socket.IO server so services can emit without
 * importing the full Socket.IO dependency.
 *
 * Uses lazy import to avoid circular dependencies during initialization.
 */
export function emitListingUpdate(
  listingId: string,
  data: { quantityAvailable: number; status: string },
): void {
  try {
    const { getIO } = require('./socketServer');
    const io = getIO();
    io.to(`listing:${listingId}`).emit('listing:updated', {
      listingId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.debug({ listingId, ...data }, 'Emitted listing:updated');
  } catch {
    // Socket.IO not initialized yet (during tests or startup)
    logger.debug({ listingId }, 'Socket.IO not available — skipping emit');
  }
}

export function emitListingExpired(listingId: string): void {
  try {
    const { getIO } = require('./socketServer');
    const io = getIO();
    io.to(`listing:${listingId}`).emit('listing:expired', {
      listingId,
      timestamp: new Date().toISOString(),
    });
    logger.debug({ listingId }, 'Emitted listing:expired');
  } catch {
    logger.debug({ listingId }, 'Socket.IO not available — skipping emit');
  }
}
