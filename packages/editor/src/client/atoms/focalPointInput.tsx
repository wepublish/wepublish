import React, {useRef, useState, useLayoutEffect} from 'react'

import {DraggableContainer, Draggable, Point} from './draggable'

import {Panel, Icon} from 'rsuite'

export interface FocalPointInputProps {
  imageURL: string
  imageWidth: number
  imageHeight: number
  maxHeight: number

  focalPoint?: Point | null
  disabled?: boolean

  onChange?: (point: Point) => void
}

export function FocalPointInput({
  imageURL,
  imageWidth,
  imageHeight,
  maxHeight,
  focalPoint,
  disabled,
  onChange
}: FocalPointInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageContainer = useRef<HTMLDivElement>(null)

  const [layouted, setLayouted] = useState(false)

  useLayoutEffect(() => {
    function layout() {
      const containerWidth = containerRef.current!.clientWidth
      const imageAspectRatio = imageWidth / imageHeight

      let imageContainerWidth = containerWidth
      let imageContainerHeight = containerWidth / imageAspectRatio

      if (imageContainerHeight > maxHeight) {
        imageContainerWidth = maxHeight * imageAspectRatio
        imageContainerHeight = maxHeight
      }

      imageContainer.current!.style.width = `${imageContainerWidth}px`
      imageContainer.current!.style.height = `${imageContainerHeight}px`
    }

    function handleResize() {
      layout()
    }

    layout()
    setLayouted(true)

    // TODO: Consider using ResizeObserver
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      ref={containerRef}>
      <div ref={imageContainer}>
        {layouted && (
          <div style={{position: 'relative', width: '100%', height: '100%'}}>
            <Panel style={{overflow: 'hidden', width: '100%', height: '100%'}}>
              <img
                src={imageURL}
                width={/* imageWidth */ '100%'}
                height={/* imageHeight  */ '100%'}
              />
            </Panel>
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%'
              }}>
              <DraggableContainer>
                {focalPoint && (
                  <Draggable point={focalPoint} onChange={onChange} disabled={disabled}>
                    <FocalPoint />
                  </Draggable>
                )}
              </DraggableContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function FocalPoint() {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',

        borderRadius: '100%',
        border: `1px solid #FFFFFF`,

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        fill: '#FFFFFF',
        fontSize: '24px'

        /* '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      } */
      }}>
      <Icon icon="square-o" />
    </div>
  )
}
