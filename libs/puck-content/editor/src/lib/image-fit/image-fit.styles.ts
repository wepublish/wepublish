import styled from '@emotion/styled';

export const RatioOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--puck-space-2);
`;

export const RatioOptionContent = styled.span`
  display: grid;
  justify-items: center;
  gap: 4px;
  font-size: var(--puck-font-size-xxxs);
  line-height: 1;
`;

export const RatioPreviewFrame = styled.span`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
`;

const ratioIsPortrait = (ratio: string) => {
  const [width, height] = ratio.split('/').map(Number);

  return height > width;
};

export const RatioPreview = styled('span', {
  shouldForwardProp: prop => prop !== 'ratio',
})<{ ratio: string }>`
  box-sizing: border-box;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: ${({ ratio }) => ratio};
  width: ${({ ratio }) => (ratioIsPortrait(ratio) ? 'auto' : '100%')};
  height: ${({ ratio }) => (ratioIsPortrait(ratio) ? '100%' : 'auto')};
  border: 1.5px solid currentColor;
  border-radius: 2px;
`;

export const RatioCustomInputs = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--puck-space-2);
  margin-top: var(--puck-space-2);
  color: var(--puck-color-text-muted);
`;

export const FitHint = styled.p`
  margin: var(--puck-space-2) 0 0;
  color: var(--puck-color-text-muted);
  font-size: var(--puck-font-size-xxxs);
`;
