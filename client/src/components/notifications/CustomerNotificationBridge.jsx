import { useEffect, useRef } from "react";
import { useNearbyListings } from "../../api/hooks";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useLocationStore } from "../../store/locationStore";
import { useNotificationStore } from "../../store/notificationStore";
function CustomerNotificationBridge() {
  const { lat, lng } = useLocationStore();
  const favorites = useFavoritesStore((state) => state.favorites);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const knownListings = useRef(null);
  const closingNotified = useRef(/* @__PURE__ */ new Set());
  const { data } = useNearbyListings({ lat, lng, radius: 10 });
  useEffect(() => {
    const listings = data?.data ?? [];
    if (!knownListings.current) {
      knownListings.current = new Set(listings.map((listing) => listing._id));
      return;
    }
    for (const listing of listings) {
      const isFavoriteStore = Boolean(listing.merchant && favorites.includes(listing.merchant._id));
      const isNew = !knownListings.current.has(listing._id);
      const minutesLeft = (new Date(listing.claimWindowEnd).getTime() - Date.now()) / 6e4;
      const isClosing = minutesLeft > 0 && minutesLeft <= 20 && !closingNotified.current.has(listing._id);
      if (isFavoriteStore && isNew) {
        notify(addNotification, "Favorite store posted", `${listing.merchant?.businessName} just listed ${listing.title} for \u20B9${listing.discountedPrice}.`, "success");
      }
      if (isFavoriteStore && isClosing) {
        closingNotified.current.add(listing._id);
        notify(addNotification, "Deal closing soon", `${listing.title} closes in ${Math.ceil(minutesLeft)} minutes. Claim before it\u2019s gone.`, "warning");
      }
      knownListings.current.add(listing._id);
    }
  }, [data, favorites, addNotification]);
  return null;
}
function notify(addNotification, title, message, type) {
  addNotification({ title, message, type });
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
}
export {
  CustomerNotificationBridge
};
