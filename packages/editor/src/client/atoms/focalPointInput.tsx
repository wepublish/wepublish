import styled from '@emotion/styled'
import React, {useLayoutEffect, useRef, useState} from 'react'
import {MdCropSquare} from 'react-icons/md'
import {Panel} from 'rsuite'

import {Draggable, DraggableContainer, Point} from './draggable'

const StyledFocalPoint = styled.div`
  width: 50;
  height: 50;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 100%;
  border: 1px solid #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  fill: #ffffff;
  font-size: 24px;
`

const StyledDraggableContainerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const StyledImage = styled.img`
  max-height: 300;
`

const StyledPanel = styled(Panel)`
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`

const StyledPanelWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const StyledFocalPointInput = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
`

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
    <StyledFocalPointInput ref={containerRef}>
      <div ref={imageContainer}>
        {layouted && (
          <StyledPanelWrapper>
            <StyledPanel>
              <StyledImage src={imageURL} />
            </StyledPanel>
            <StyledDraggableContainerWrapper>
              <DraggableContainer>
                {focalPoint && (
                  <Draggable point={focalPoint} onChange={onChange} disabled={disabled}>
                    <FocalPoint />
                  </Draggable>
                )}
              </DraggableContainer>
            </StyledDraggableContainerWrapper>
          </StyledPanelWrapper>
        )}
      </div>
    </StyledFocalPointInput>
  )
}

export function FocalPoint() {
  return (
    <StyledFocalPoint>
      <MdCropSquare />
    </StyledFocalPoint>
  )
}
