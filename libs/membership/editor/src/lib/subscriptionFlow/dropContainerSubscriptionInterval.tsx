import React from 'react'
import {useDroppable} from '@dnd-kit/core'

interface DropContainerSubscriptionIntervalProps {
  dayIndex: number
}
export default function DropContainerSubscriptionInterval({
  dayIndex
}: DropContainerSubscriptionIntervalProps) {
  const {isOver, setNodeRef, active} = useDroppable({
    id: `droppable-${dayIndex}`,
    data: {
      dayIndex
    }
  })
  const style = isOver
    ? {
        color: 'white',
        border: '1px solid black',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }
    : {}

  if (!active) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        height: '40px',
        border: 'dotted 1px black',
        display: 'flex',
        alignItems: 'center',
        ...style
      }}>
      <div style={{width: '100%', textAlign: 'center'}}>Hier hin verschieben</div>
    </div>
  )
}
