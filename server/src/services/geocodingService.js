import { logger } from "../utils/logger.js";
const geocodingService = {
  /**
   * Geocode an address string to lat/lng coordinates.
   * Returns null if no results found.
   */
  async geocodeAddress(address) {
    try {
      const encoded = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "FoodSaver-DirectConnect/1.0",
          Accept: "application/json"
        }
      });
      if (!response.ok) {
        logger.warn(
          { status: response.status, address },
          "Nominatim geocoding request failed"
        );
        return null;
      }
      const data = await response.json();
      if (!data || data.length === 0) {
        logger.warn({ address }, "No geocoding results found");
        return null;
      }
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        logger.warn({ lat, lng, address }, "Implausible geocoding coordinates");
        return null;
      }
      return {
        lat,
        lng,
        displayName: result.display_name
      };
    } catch (err) {
      logger.error({ err, address }, "Geocoding error");
      return null;
    }
  },
  /**
   * Validates that coordinates are plausible (within valid ranges).
   */
  validateCoordinates(lat, lng) {
    return typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
};
export {
  geocodingService
};
