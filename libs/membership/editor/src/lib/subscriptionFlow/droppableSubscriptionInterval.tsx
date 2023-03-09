import React from 'react'
import {useDroppable} from '@dnd-kit/core'

interface DropContainerSubscriptionIntervalProps {
  dayIndex: number
}
export default function DroppableSubscriptionInterval({
  dayIndex
}: DropContainerSubscriptionIntervalProps) {
  const {isOver, setNodeRef, active} = useDroppable({
    id: `droppable-${dayIndex}`,
    data: {
      dayIndex
    }
  })

  const defaultStyle = {
    transition: 'border 600ms ease-in-out',
    border: '2px dashed white',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    minHeight: '50px'
  } as const

  // not dragging
  if (!active) {
    return null
  }

  const activeStyle = {
    border: '2px dashed lightgrey'
  }

  const hoverStyle = isOver
    ? {
        backgroundColor: '#EEE'
      }
    : {}

  return (
    <div ref={setNodeRef} style={{...defaultStyle, ...activeStyle, ...hoverStyle}}>
      Hierhin verschieben
    </div>
  )
}
