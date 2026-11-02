import { Typography } from '@mui/material';
import { selectTeaserDate } from '@wepublish/block-content/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';

export type TeaserDateConfigProps = HideWhenEmptyProps & {
  className?: string;
  showTime?: boolean;
};

export const TeaserDate = ({
  className,
  showTime = false,
  hideWhenEmpty = true,
}: TeaserDateConfigProps) => {
  const { date } = useWebsiteBuilder();
  const teaser = useTeaserSlot();
  const publishDate = teaser && selectTeaserDate(teaser);

  if (!publishDate) {
    return hideWhenEmpty ? null : (
        <Typography
          className={className}
          variant="teaserMeta"
          component="span"
          aria-hidden
        >
          {' '}
        </Typography>
      );
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
