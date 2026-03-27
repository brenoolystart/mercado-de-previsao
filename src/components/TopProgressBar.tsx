import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function TopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start progress on route change
    setProgress(0);
    setVisible(true);

    // Quick ramp to ~85%
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 85) {
        p = 85;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(p);
    }, 80);

    // Complete after short delay (simulates load)
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 200ms ease',
          boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
        }}
      />
    </div>
  );
}
