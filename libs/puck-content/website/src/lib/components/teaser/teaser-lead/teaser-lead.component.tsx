import { Typography } from '@mui/material';
import { selectTeaserLead } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';

export type TeaserLeadConfigProps = HideWhenEmptyProps & {
  className?: string;
};

export const TeaserLead = ({
  className,
  hideWhenEmpty = true,
}: TeaserLeadConfigProps) => {
  const teaser = useTeaserSlot();
  const lead = teaser && selectTeaserLead(teaser);

  if (!lead && hideWhenEmpty) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserLead"
      component="p"
      aria-hidden={!lead || undefined}
    >
      {lead || ' '}
    </Typography>
  );
};
