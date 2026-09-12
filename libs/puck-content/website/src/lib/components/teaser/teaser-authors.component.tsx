import { Typography } from '@mui/material';
import { selectTeaserAuthors } from '@wepublish/block-content/website';
import { useTranslation } from 'react-i18next';

import { useTeaserSlot } from '../../contexts/teaser-slot.context';

export type TeaserAuthorsConfigProps = {
  className?: string;
};

export const TeaserAuthors = ({ className }: TeaserAuthorsConfigProps) => {
  const { t } = useTranslation();
  const teaser = useTeaserSlot();
  const authors = teaser && selectTeaserAuthors(teaser);

  if (!authors?.length) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserMeta"
      component="span"
    >
      {t('teaser.author.text', {
        authors: authors.join(t('teaser.author.seperator')),
      })}
    </Typography>
  );
};
