import { RichtextJSONDocument } from '@wepublish/richtext';
import { ListicleBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { dataImageById } from '../data-images';

export type ListicleConfigProps = {
  items: Array<{
    title: string;
    richText: RichtextJSONDocument;
    imageId?: string;
  }>;
};

export const ListicleRender: PuckBlockComponent<ListicleConfigProps> = ({
  props: { items },
  data,
  className,
}) => (
  <ListicleBlock
    className={className}
    items={items.map(({ title, richText, imageId }) => ({
      __typename: 'ListicleItem' as const,
      title,
      richText,
      image: dataImageById(data, imageId),
    }))}
  />
);
