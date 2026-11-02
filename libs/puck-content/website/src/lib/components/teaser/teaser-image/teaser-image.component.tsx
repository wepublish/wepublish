import { Theme } from '@emotion/react';
import { selectTeaserImage } from '@wepublish/block-content/website';
import { Image } from '@wepublish/website/builder';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { ImageFit, imageFitStyles } from '../../../values/image-fit';
import { HideWhenEmptyProps } from '../teaser-part';
import {
  teaserImageFitStyles,
  teaserImagePlaceholderFitStyles,
  TeaserImagePlaceholder,
} from './teaser-image.styles';

export type TeaserImageConfigProps = HideWhenEmptyProps & {
  className?: string;
  fit?: ImageFit;
};

export const TeaserImage = ({
  className,
  fit,
  hideWhenEmpty = true,
}: TeaserImageConfigProps) => {
  const teaser = useTeaserSlot();
  const image = teaser && selectTeaserImage(teaser);

  if (!image) {
    return hideWhenEmpty ? null : (
        <TeaserImagePlaceholder
          className={className}
          aria-hidden
          css={(theme: Theme) =>
            imageFitStyles(theme, fit, teaserImagePlaceholderFitStyles)
          }
        />
      );
  }

  return (
    <Image
      className={className}
      image={image}
      css={(theme: Theme) =>
        imageFitStyles(theme, fit, teaserImageFitStyles(image))
      }
    />
  );
};
