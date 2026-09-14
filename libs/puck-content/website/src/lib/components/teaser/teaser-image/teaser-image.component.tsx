import { selectTeaserImage } from '@wepublish/block-content/website';
import { Image } from '@wepublish/website/builder';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';

export type TeaserImageConfigProps = {
  className?: string;
};

export const TeaserImage = ({ className }: TeaserImageConfigProps) => {
  const teaser = useTeaserSlot();
  const image = teaser && selectTeaserImage(teaser);

  if (!image) {
    return null;
  }

  return (
    <Image
      className={className}
      image={image}
    />
  );
};
