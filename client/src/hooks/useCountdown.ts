import { useEffect, useMemo, useState } from 'react';

export type Countdown = {
  expired: boolean;
  urgent: boolean;
  totalSeconds: number;
  label: string;
};

function getCountdown(endAt: string | Date): Countdown {
  const totalSeconds = Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000));

  if (totalSeconds === 0) {
    return { expired: true, urgent: true, totalSeconds, label: 'Expired' };
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const label = hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { expired: false, urgent: totalSeconds < 60 * 60, totalSeconds, label };
}

/** Keeps offer and pickup timers accurate without relying on a server refresh. */
export function useCountdown(endAt: string | Date): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    void now;
    return getCountdown(endAt);
  }, [endAt, now]);
}

export function getCountdownLabel(endAt: string | Date) {
  return getCountdown(endAt);
}
