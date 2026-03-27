import { useRef, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<'enter' | 'exit'>('enter');
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key;
      setStage('exit');

      const t = setTimeout(() => {
        setDisplayChildren(children);
        setStage('enter');
      }, 150);

      return () => clearTimeout(t);
    } else {
      setDisplayChildren(children);
    }
  }, [location.key, children]);

  return (
    <div
      className={stage === 'enter' ? 'page-enter' : 'page-exit'}
      style={{ minHeight: '100dvh' }}
    >
      {displayChildren}
    </div>
  );
}
