import { Chip } from '@mui/material';
import { selectTeaserTags } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';
import { TagsWrapper } from './teaser-tags.styles';

export type TeaserTagsConfigProps = HideWhenEmptyProps & {
  className?: string;
  max?: number;
};

export const TeaserTags = ({
  className,
  max = 5,
  hideWhenEmpty = true,
}: TeaserTagsConfigProps) => {
  const teaser = useTeaserSlot();
  const tags = teaser ? selectTeaserTags(teaser) : [];

  if (!tags.length) {
    return hideWhenEmpty ? null : (
        <TagsWrapper
          className={className}
          empty
          aria-hidden
        />
      );
  }

  return (
    <TagsWrapper className={className}>
      {tags.slice(0, max).map(tag => (
        <Chip
          key={tag.id}
          label={tag.tag}
          color="primary"
          variant="outlined"
        />
      ))}
    </TagsWrapper>
  );
};
