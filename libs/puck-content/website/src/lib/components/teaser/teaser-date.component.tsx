import { Typography } from '@mui/material';
import { selectTeaserDate } from '@wepublish/block-content/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { useTeaserSlot } from '../../contexts/teaser-slot.context';

export type TeaserDateConfigProps = {
  className?: string;
  showTime?: boolean;
};

export const TeaserDate = ({
  className,
  showTime = false,
}: TeaserDateConfigProps) => {
  const { date } = useWebsiteBuilder();
  const teaser = useTeaserSlot();
  const publishDate = teaser && selectTeaserDate(teaser);

  if (!publishDate) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserMeta"
      component="time"
      suppressHydrationWarning
      dateTime={publishDate}
    >
      {date.format(new Date(publishDate), showTime)}
    </Typography>
  );
};
