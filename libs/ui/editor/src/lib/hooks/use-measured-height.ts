import { RefObject, useEffect, useState } from 'react';

export function useMeasuredHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setHeight(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      );
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}
