import { Typography } from '@mui/material';
import { selectTeaserTitle } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';

export type TeaserTitleConfigProps = {
  className?: string;
};

export const TeaserTitle = ({ className }: TeaserTitleConfigProps) => {
  const teaser = useTeaserSlot();
  const title = teaser && selectTeaserTitle(teaser);

  if (!title) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserTitle"
      component="h2"
    >
      {title}
    </Typography>
  );
};
