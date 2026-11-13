import { RefCallback, useCallback, useRef, useState } from 'react';

/** The element that scrolls `element`: the editor scrolls its page content, not the window. */
const scrollParentOf = (element: HTMLElement) => {
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) {
      return parent;
    }
  }

  return document.documentElement;
};

/**
 * Whether an element fits the area that scrolls it, `offset` above and below
 * included. Only then can it stick: a taller one sticks with its end out of
 * reach until the rest of the page was scrolled past.
 */
export function useStickyWhenFits<Element extends HTMLElement>(
  offset: number
): [RefCallback<Element>, boolean] {
  const [sticky, setSticky] = useState(false);
  const observer = useRef<ResizeObserver>(undefined);

  const ref = useCallback<RefCallback<Element>>(
    element => {
      observer.current?.disconnect();
      observer.current = undefined;

      if (!element || typeof ResizeObserver === 'undefined') {
        return;
      }

      const scrollParent = scrollParentOf(element);
      const measure = () =>
        setSticky(
          element.offsetHeight + 2 * offset <= scrollParent.clientHeight
        );

      observer.current = new ResizeObserver(measure);
      observer.current.observe(element);
      observer.current.observe(scrollParent);
    },
    [offset]
  );

  return [ref, sticky];
}
