import { useState, useCallback, useRef, useEffect } from 'react';

export function useLoadingBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(0);
    setVisible(true);

    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 85) {
        p = 85;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(p);
    }, 60);
  }, []);

  const done = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const bar = visible ? (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 150ms ease',
          boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
        }}
      />
    </div>
  ) : null;

  return { start, done, bar };
}
