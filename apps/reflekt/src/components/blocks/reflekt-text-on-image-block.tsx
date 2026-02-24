import styled from '@emotion/styled';
import { isImageBlock } from '@wepublish/block-content/website';
import {
  BlockContent,
  ImageBlock as ImageBlockType,
} from '@wepublish/website/api';
import {
  BuilderFlexBlockProps,
  Image,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TextOnImageWrapper = styled('div')`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  display: grid;
`;

const BgImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  grid-area: 1 / 1;
`;

const TextOverlay = styled('div')`
  grid-area: 1 / 1;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  text-align: center;
`;

export const ReflektTextOnImageBlock = ({ blocks }: BuilderFlexBlockProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  const imageBlock = sortedBlocks.find(b => b.block && isImageBlock(b.block))
    ?.block as ImageBlockType | undefined;

  const textBlocks = sortedBlocks.filter(
    b => !b.block || !isImageBlock(b.block)
  );

  return (
    <TextOnImageWrapper>
      {imageBlock?.image && (
        <BgImage
          image={imageBlock.image}
          maxWidth={1500}
        />
      )}

      {textBlocks.length > 0 && (
        <TextOverlay>
          <div>
            {textBlocks.map((b, i) => (
              <Renderer
                key={i}
                block={b.block as BlockContent}
                type="Article"
                index={i}
                count={textBlocks.length}
              />
            ))}
          </div>
        </TextOverlay>
      )}
    </TextOnImageWrapper>
  );
};
