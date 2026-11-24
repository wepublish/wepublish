import {
  MouseEvent,
  PointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';

/** Pixels per second the band runs by itself */
const speed = 40;
/** How far the pointer has to move before a press counts as dragging */
const dragThreshold = 5;
/** How long the band waits after a swipe or a wheel scroll before it runs on */
const resumeAfterMs = 2000;

/**
 * Keeps the position within the first set of logos. The second set looks
 * the same, so jumping by one set is invisible and the band never ends.
 */
export const wrapScroll = (position: number, loopWidth: number) => {
  if (loopWidth <= 0) {
    return position;
  }

  return ((position % loopWidth) + loopWidth) % loopWidth;
};

export const advanceScroll = (
  position: number,
  elapsedMs: number,
  pixelsPerSecond: number,
  loopWidth: number
) => wrapScroll(position + (pixelsPerSecond * elapsedMs) / 1000, loopWidth);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs the band by scrolling it, so that it can also be dragged with the
 * mouse and swiped on a trackpad or a touch screen. It stops while the
 * pointer is above it or a logo has the focus.
 */
export const useLogoBandScroll = (
  viewportRef: RefObject<HTMLElement | null>,
  loopRef: RefObject<HTMLElement | null>
) => {
  const isHovered = useRef(false);
  const isFocused = useRef(false);
  const pausedUntil = useRef(0);
  const position = useRef(0);
  const drag = useRef<{ startX: number; startScroll: number } | null>(null);
  const wasDragged = useRef(false);

  const loopWidth = useCallback(
    () => (prefersReducedMotion() ? 0 : (loopRef.current?.offsetWidth ?? 0)),
    [loopRef]
  );

  const scrollTo = useCallback(
    (value: number) => {
      position.current = value;

      if (viewportRef.current) {
        viewportRef.current.scrollLeft = value;
      }
    },
    [viewportRef]
  );

  useEffect(() => {
    let frame = 0;
    let lastTime: number | undefined;

    const tick = (time: number) => {
      const viewport = viewportRef.current;
      const elapsed = lastTime === undefined ? 0 : time - lastTime;
      lastTime = time;

      if (viewport) {
        const isPaused =
          isHovered.current ||
          isFocused.current ||
          drag.current ||
          time < pausedUntil.current;

        if (!isPaused && !prefersReducedMotion()) {
          scrollTo(
            advanceScroll(position.current, elapsed, speed, loopWidth())
          );
        } else if (!drag.current) {
          // Swiped or scrolled by hand: carry on from there
          const wrapped = wrapScroll(viewport.scrollLeft, loopWidth());

          if (Math.abs(wrapped - viewport.scrollLeft) >= 1) {
            scrollTo(wrapped);
          } else if (Math.abs(viewport.scrollLeft - position.current) >= 1) {
            position.current = viewport.scrollLeft;
          }
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [viewportRef, loopWidth, scrollTo]);

  const pauseForAWhile = () => {
    pausedUntil.current = performance.now() + resumeAfterMs;
  };

  const endDrag = () => {
    drag.current = null;
    viewportRef.current?.removeAttribute('data-dragging');
  };

  return {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        isHovered.current = true;
      }
    },
    onPointerLeave: () => {
      isHovered.current = false;
      endDrag();
    },
    onPointerDown: (event: PointerEvent) => {
      wasDragged.current = false;

      // Touch screens scroll the band natively
      if (event.pointerType === 'touch') {
        pauseForAWhile();
        return;
      }

      if (event.button === 0) {
        drag.current = {
          startX: event.clientX,
          startScroll: viewportRef.current?.scrollLeft ?? position.current,
        };
      }
    },
    onPointerMove: (event: PointerEvent) => {
      if (!drag.current) {
        return;
      }

      const distance = event.clientX - drag.current.startX;

      if (Math.abs(distance) > dragThreshold) {
        wasDragged.current = true;
        viewportRef.current?.setAttribute('data-dragging', 'true');
      }

      const target = drag.current.startScroll - distance;
      const wrapped = wrapScroll(target, loopWidth());
      // Keep dragging smoothly across the jump between the two sets
      drag.current.startScroll += wrapped - target;
      scrollTo(wrapped);
    },
    onPointerUp: endDrag,
    onWheel: pauseForAWhile,
    onFocus: () => {
      isFocused.current = true;
    },
    onBlur: () => {
      isFocused.current = false;
    },
    // A drag ends with a click on the logo below the pointer: that is not meant to open it
    onClickCapture: (event: MouseEvent) => {
      if (wasDragged.current) {
        event.preventDefault();
        event.stopPropagation();
        wasDragged.current = false;
      }
    },
  };
};
