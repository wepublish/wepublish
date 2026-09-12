import { Typography } from '@mui/material';
import { selectTeaserLead } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../contexts/teaser-slot.context';

export type TeaserLeadConfigProps = {
  className?: string;
};

export const TeaserLead = ({ className }: TeaserLeadConfigProps) => {
  const teaser = useTeaserSlot();
  const lead = teaser && selectTeaserLead(teaser);

  if (!lead) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserLead"
      component="p"
    >
      {lead}
    </Typography>
  );
};
