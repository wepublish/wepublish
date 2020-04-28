import {RefObject, useEffect, useState} from 'react'

export const HasIntersectionObserverSupport =
  typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined'

/**
 * Hook which returns wherever the referenced element was once visible
 *
 * @param ref Reference to element which should be observed.
 * @param threshold Threshold that defines how much of the observed element should be visible to trigger a visibility change return. (number 0.5 = 50% or array of numbers). Default is 0.
 * @param root The element that is used as the viewport. Default is the browser viewport.
 */
export function usePermanentVisibility(
  ref: RefObject<HTMLElement>,
  {root = null, rootMargin = '0px', threshold = 0}: IntersectionObserverInit = {}
): boolean {
  const [wasVisible, setWasVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!wasVisible && element) {
      if (HasIntersectionObserverSupport) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setWasVisible(true)
              observer.unobserve(element)
            }
          },
          {
            root,
            rootMargin,
            threshold
          }
        )

        observer.observe(element)
        return () => observer.unobserve(element)
      } else {
        setWasVisible(true)
        return () => {}
      }
    } else {
      return () => {}
    }
  }, [wasVisible])

  return wasVisible
}
