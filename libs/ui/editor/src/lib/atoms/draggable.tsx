import styled from '@emotion/styled';
import {
  createContext,
  KeyboardEvent,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';

export interface Point {
  x: number;
  y: number;
}

export const DraggableContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export interface DraggableContainerProps {
  children?: ReactNode;
}

const Container = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  user-select: none;
`;

const DraggableWrapper = styled.div`
  cursor: move;
  position: absolute;
  transform: translate(-50%, -50%);
  transform-origin: center;
  user-select: none;
  touch-action: none;
  display: none;
  border-radius: 50%;

  &[data-layouted='true'] {
    display: block;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

const KEYBOARD_STEP = 0.05;
const FINE_KEYBOARD_STEP = 0.01;

const clamp = (value: number) =>
  Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;

export function DraggableContainer({ children }: DraggableContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Container ref={ref}>
      <DraggableContext.Provider value={ref}>
        {children}
      </DraggableContext.Provider>
    </Container>
  );
}

export interface DraggableProps {
  point: Point;
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
  valueText?: (point: Point) => string;

  onChange?(point: Point): void;
}

export function Draggable({
  children,
  point,
  disabled,
  label,
  valueText,
  onChange,
}: DraggableProps) {
  const draggableRef = useRef<HTMLDivElement>(null);
  const containerRef = useContext(DraggableContext);

  if (!containerRef) {
    throw new Error('Draggable cannot be used without a DraggableContainer.');
  }

  useEffect(() => {
    const container = containerRef.current!;
    const draggable = draggableRef.current!;
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;

    let realPoint: Point = {
      x: containerWidth * point.x,
      y: containerHeight * point.y,
    };
    let lastPointerPosition: Point | null = null;
    let dragged = false;

    function clampPoint(point: Point) {
      return {
        x: Math.max(0, Math.min(containerWidth, point.x)),
        y: Math.max(0, Math.min(containerHeight, point.y)),
      };
    }

    function setTransform(point: Point) {
      const clampedPoint = clampPoint(point);
      draggable.style.transform = `translate(-50%, -50%) translate(${clampedPoint.x}px, ${clampedPoint.y}px)`;
    }

    setTransform(realPoint);
    draggable.dataset.layouted = 'true';

    function handlePointerMove(e: PointerEvent) {
      if (lastPointerPosition) {
        const deltaPoint: Point = {
          x: lastPointerPosition.x - e.pageX,
          y: lastPointerPosition.y - e.pageY,
        };

        realPoint = {
          x: realPoint.x - deltaPoint.x,
          y: realPoint.y - deltaPoint.y,
        };

        dragged = true;
        setTransform(realPoint);
        lastPointerPosition = { x: e.pageX, y: e.pageY };
      }
    }

    function handlePointerDown(e: PointerEvent) {
      e.stopPropagation();
      dragged = false;
      lastPointerPosition = { x: e.pageX, y: e.pageY };
    }

    function handlePointerUp() {
      if (!lastPointerPosition) {
        return;
      }

      const clampedPoint = clampPoint(realPoint);

      lastPointerPosition = null;

      if (onChange && containerWidth && containerHeight) {
        onChange({
          x: clampedPoint.x / containerWidth,
          y: clampedPoint.y / containerHeight,
        });
      }
    }

    function handleContainerClick(e: MouseEvent) {
      if (dragged || draggable.contains(e.target as Node)) {
        dragged = false;
        return;
      }

      const rect = container.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      onChange?.({
        x: clamp((e.clientX - rect.left) / rect.width),
        y: clamp((e.clientY - rect.top) / rect.height),
      });
    }

    function handleResize() {
      containerWidth = container.clientWidth;
      containerHeight = container.clientHeight;
      realPoint = { x: containerWidth * point.x, y: containerHeight * point.y };

      setTransform(realPoint);
    }

    window.addEventListener('resize', handleResize);

    if (!disabled) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      draggable.addEventListener('pointerdown', handlePointerDown);
      container.addEventListener('click', handleContainerClick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);

      if (!disabled) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);

        draggable.removeEventListener('pointerdown', handlePointerDown);
        container.removeEventListener('click', handleContainerClick);
      }
    };
  }, [containerRef, draggableRef, point, disabled, onChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? FINE_KEYBOARD_STEP : KEYBOARD_STEP;
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = delta[event.key];

    if (!move || disabled) {
      return;
    }

    event.preventDefault();
    onChange?.({ x: clamp(point.x + move.x), y: clamp(point.y + move.y) });
  };

  return (
    <DraggableWrapper
      ref={draggableRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(point.x * 100)}
      aria-valuetext={valueText?.(point)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </DraggableWrapper>
  );
}
