import React, {forwardRef} from 'react'

export const PlaceholderImage = forwardRef<SVGSVGElement>(function PlaceholderImage(props, ref) {
  return (
    <svg
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fill: 'inherit',
        stroke: 'gray'
      }}
      viewBox="0 0 64 64"
      preserveAspectRatio="none">
      <line
        x1="0"
        y1="0"
        x2="64"
        y2="64"
        fill="none"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="64"
        y1="0"
        x2="0"
        y2="64"
        fill="none"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
})
