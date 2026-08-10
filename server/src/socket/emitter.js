import { logger } from "../utils/logger.js";
async function emitListingUpdate(listingId, data) {
  try {
    const { getIO } = await import("./socketServer.js");
    const io = getIO();
    io.to(`listing:${listingId}`).emit("listing:updated", {
      listingId,
      ...data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.debug({ listingId, ...data }, "Emitted listing:updated");
  } catch {
    logger.debug({ listingId }, "Socket.IO not available \u2014 skipping emit");
  }
}
async function emitListingExpired(listingId) {
  try {
    const { getIO } = await import("./socketServer.js");
    const io = getIO();
    io.to(`listing:${listingId}`).emit("listing:expired", {
      listingId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.debug({ listingId }, "Emitted listing:expired");
  } catch {
    logger.debug({ listingId }, "Socket.IO not available \u2014 skipping emit");
  }
}
export {
  emitListingExpired,
  emitListingUpdate
};
