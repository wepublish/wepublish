import styled from '@emotion/styled';
import { useLayoutEffect, useRef, useState } from 'react';
import { MdCropSquare } from 'react-icons/md';
import { Panel as RPanel } from 'rsuite';

import { Draggable, DraggableContainer, Point } from './draggable';

const FocalPointElement = styled.div`
  width: 50px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 100%;
  border: 1px solid #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  fill: #ffffff;
  font-size: 24px;
`;

const DraggableContainerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const Image = styled.img`
  max-height: 300px;
`;

const Panel = styled(RPanel)`
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const PanelWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const FocalPointInputWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export interface FocalPointInputProps {
  imageURL: string;
  imageWidth: number;
  imageHeight: number;
  maxHeight: number;

  focalPoint?: Point | null;
  disabled?: boolean;

  onChange?: (point: Point) => void;
}

export function FocalPointInput({
  imageURL,
  imageWidth,
  imageHeight,
  maxHeight,
  focalPoint,
  disabled,
  onChange,
}: FocalPointInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainer = useRef<HTMLDivElement>(null);

  const [layouted, setLayouted] = useState(false);

  useLayoutEffect(() => {
    function layout() {
      const containerWidth = containerRef.current!.clientWidth;
      const imageAspectRatio = imageWidth / imageHeight;

      let imageContainerWidth = containerWidth;
      let imageContainerHeight = containerWidth / imageAspectRatio;

      if (imageContainerHeight > maxHeight) {
        imageContainerWidth = maxHeight * imageAspectRatio;
        imageContainerHeight = maxHeight;
      }

      imageContainer.current!.style.width = `${imageContainerWidth}px`;
      imageContainer.current!.style.height = `${imageContainerHeight}px`;
    }

    function handleResize() {
      layout();
    }

    layout();
    setLayouted(true);

    // TODO: Consider using ResizeObserver
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <FocalPointInputWrapper ref={containerRef}>
      <div ref={imageContainer}>
        {layouted && (
          <PanelWrapper>
            <Panel>
              <Image src={imageURL} />
            </Panel>
            <DraggableContainerWrapper>
              <DraggableContainer>
                {focalPoint && (
                  <Draggable
                    point={focalPoint}
                    onChange={onChange}
                    disabled={disabled}
                  >
                    <FocalPoint />
                  </Draggable>
                )}
              </DraggableContainer>
            </DraggableContainerWrapper>
          </PanelWrapper>
        )}
      </div>
    </FocalPointInputWrapper>
  );
}

export function FocalPoint() {
  return (
    <FocalPointElement>
      <MdCropSquare />
    </FocalPointElement>
  );
}
