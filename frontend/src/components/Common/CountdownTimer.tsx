import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  expiresAt: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<Props> = ({ expiresAt, onExpire }) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const initial = calc();
    setRemainingSeconds(initial);

    if (initial <= 0) {
      onExpireRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calc();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isExpired = remainingSeconds <= 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 120;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '15px',
        fontVariantNumeric: 'tabular-nums',
        backgroundColor: isExpired ? '#fee2e2' : isUrgent ? '#ffedd5' : '#e0f2fe',
        color: isExpired ? '#b91c1c' : isUrgent ? '#c2410c' : '#0369a1',
        border: `1px solid ${isExpired ? '#fca5a5' : isUrgent ? '#fdba74' : '#bae6fd'}`,
      }}
    >
      <Clock size={16} className={!isExpired ? 'animate-pulse' : ''} />
      <span>{isExpired ? '00:00 (মেয়াদ শেষ / Expired)' : `${formattedTime} বাকি (Remaining)`}</span>
    </div>
  );
};
