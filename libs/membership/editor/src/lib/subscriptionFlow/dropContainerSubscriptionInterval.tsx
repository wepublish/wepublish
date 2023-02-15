import React from 'react'
import {useDroppable} from '@dnd-kit/core'

interface DropContainerSubscriptionIntervalProps {
  dayIndex: number
  children: React.ReactNode
}
export default function DropContainerSubscriptionInterval({
  dayIndex,
  children
}: DropContainerSubscriptionIntervalProps) {
  const {isOver, setNodeRef, active} = useDroppable({
    id: `droppable-${dayIndex}`,
    data: {
      dayIndex
    }
  })

  const defaultStyle = {
    transition: 'padding 400ms ease-in-out',
    border: '2px dashed lightgrey',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    minHeight: '50px'
  } as const

  // not dragging
  if (!active) {
    return <div style={{...defaultStyle}}>{children}</div>
  }

  const hoverStyle = isOver
    ? {
        backgroundColor: '#EEE'
      }
    : {}

  return (
    <div ref={setNodeRef} style={{...defaultStyle, ...hoverStyle}}>
      {children}
    </div>
  )
}
