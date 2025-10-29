import styled from '@emotion/styled';
import {
  BuilderListicleBlockProps,
  Image,
  RichTextBlock,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  BlockContent,
  ListicleBlock as ListicleBlockType,
} from '@wepublish/website/api';

export const isListicleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is ListicleBlockType => block.__typename === 'ListicleBlock';

export const ListicleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(10)};
  grid-template-columns: minmax(min-content, 700px);
  justify-content: center;
`;

export const ListicleBlockItem = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-items: center;
`;

export const ListicleBlockItemCounter = styled('div')`
  display: grid;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  font-size: 1.5em;
  line-height: 1;
  width: 2em;
  height: 2em;
`;

export const ListicleItemTitle = styled('h3')``;
export const ListicleImage = styled(Image)``;
export const ListicleRichtText = styled(RichTextBlock)``;

export const ListicleBlock = ({
  items,
  className,
}: BuilderListicleBlockProps) => {
  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  return (
    <ListicleBlockWrapper className={className}>
      {items.map((item, index) => (
        <ListicleBlockItem key={index}>
          <ListicleBlockItemCounter>{index + 1}</ListicleBlockItemCounter>

          <H3 component={ListicleItemTitle}>{item.title}</H3>
          {item.image && <ListicleImage image={item.image} />}
          <ListicleRichtText richText={item.richText} />
        </ListicleBlockItem>
      ))}
    </ListicleBlockWrapper>
  );
};
