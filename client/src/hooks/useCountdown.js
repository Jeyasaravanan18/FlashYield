import { useEffect, useMemo, useState } from "react";
function getCountdown(endAt) {
  const totalSeconds = Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1e3));
  if (totalSeconds === 0) {
    return { expired: true, urgent: true, totalSeconds, label: "Expired" };
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const label = hours > 0 ? `${hours}h ${minutes.toString().padStart(2, "0")}m` : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return { expired: false, urgent: totalSeconds < 60 * 60, totalSeconds, label };
}
function useCountdown(endAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1e3);
    return () => window.clearInterval(timer);
  }, []);
  return useMemo(() => {
    void now;
    return getCountdown(endAt);
  }, [endAt, now]);
}
function getCountdownLabel(endAt) {
  return getCountdown(endAt);
}
export {
  getCountdownLabel,
  useCountdown
};
