import { Chip } from '@mui/material';
import styled from '@emotion/styled';
import { selectTeaserTags } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';

export type TeaserTagsConfigProps = {
  className?: string;
  max?: number;
};

const TagsWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const TeaserTags = ({ className, max = 5 }: TeaserTagsConfigProps) => {
  const teaser = useTeaserSlot();
  const tags = teaser ? selectTeaserTags(teaser) : [];

  if (!tags.length) {
    return null;
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
