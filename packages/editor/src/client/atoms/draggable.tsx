import React, {
  createContext,
  ReactNode,
  useRef,
  useContext,
  useEffect,
  RefObject,
  useState
} from 'react'

export interface Point {
  readonly x: number
  readonly y: number
}

export const DraggableContext = createContext<RefObject<HTMLDivElement> | null>(null)

export interface DraggableContainerProps {
  readonly children?: ReactNode
}

export function DraggableContainer({children}: DraggableContainerProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        userSelect: 'none'
      }}
      ref={ref}>
      <DraggableContext.Provider value={ref}>{children}</DraggableContext.Provider>
    </div>
  )
}

export interface DraggableProps {
  readonly point: Point
  readonly children?: ReactNode
  readonly disabled?: boolean

  onChange?(point: Point): void
}

export function Draggable({children, point, disabled, onChange}: DraggableProps) {
  const [layouted, setLayouted] = useState(false)

  const draggableRef = useRef<HTMLDivElement>(null)
  const containerRef = useContext(DraggableContext)

  if (!containerRef) throw new Error('Draggable cannot be used without a DraggableContainer.')

  useEffect(() => {
    let containerWidth = containerRef.current!.clientWidth
    let containerHeight = containerRef.current!.clientHeight

    let realPoint: Point = {x: containerWidth * point.x, y: containerHeight * point.y}
    let lastMousePosition: Point | null = null

    setTransform(realPoint)
    setLayouted(true)

    function clampPoint(point: Point) {
      return {
        x: Math.max(0, Math.min(containerWidth, point.x)),
        y: Math.max(0, Math.min(containerHeight, point.y))
      }
    }

    function setTransform(point: Point) {
      const clampedPoint = clampPoint(point)
      draggableRef.current!.style.transform = `translate(-50%, -50%) translate(${clampedPoint.x}px, ${clampedPoint.y}px)`
    }

    function handleMouseMove(e: MouseEvent) {
      if (lastMousePosition) {
        const deltaPoint: Point = {
          x: lastMousePosition.x - e.pageX,
          y: lastMousePosition.y - e.pageY
        }

        realPoint = {
          x: realPoint.x - deltaPoint.x,
          y: realPoint.y - deltaPoint.y
        }

        setTransform(realPoint)
        lastMousePosition = {x: e.pageX, y: e.pageY}
      }
    }

    function handleMouseDown(e: MouseEvent) {
      lastMousePosition = {x: e.pageX, y: e.pageY}
    }

    function handleMouseUp() {
      const clampedPoint = clampPoint(realPoint)

      lastMousePosition = null

      if (onChange) {
        onChange({x: clampedPoint.x / containerWidth, y: clampedPoint.y / containerHeight})
      }
    }

    function handleResize() {
      containerWidth = containerRef!.current!.clientWidth
      containerHeight = containerRef!.current!.clientHeight
      realPoint = {x: containerWidth * point.x, y: containerHeight * point.y}

      setTransform(realPoint)
    }

    // TODO: Consider using ResizeObserver
    window.addEventListener('resize', handleResize)

    if (!disabled) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      draggableRef.current!.addEventListener('mousedown', handleMouseDown)
    }

    return () => {
      window.removeEventListener('resize', handleResize)

      if (!disabled) {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)

        draggableRef.current!.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [containerRef, draggableRef, point, disabled])

  return (
    <div
      ref={draggableRef}
      style={{
        display: layouted ? 'block' : 'none',
        cursor: 'move',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center',
        userSelect: 'none'
      }}>
      {children}
    </div>
  )
}
