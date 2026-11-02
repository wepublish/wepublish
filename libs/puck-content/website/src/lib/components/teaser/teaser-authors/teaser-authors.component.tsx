import { Typography } from '@mui/material';
import { selectTeaserAuthors } from '@wepublish/block-content/website';
import { useTranslation } from 'react-i18next';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';

export type TeaserAuthorsConfigProps = HideWhenEmptyProps & {
  className?: string;
};

export const TeaserAuthors = ({
  className,
  hideWhenEmpty = true,
}: TeaserAuthorsConfigProps) => {
  const { t } = useTranslation();
  const teaser = useTeaserSlot();
  const authors = teaser && selectTeaserAuthors(teaser);
  const empty = !authors?.length;

  if (empty && hideWhenEmpty) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserMeta"
      component="span"
      aria-hidden={empty || undefined}
    >
      {empty ?
        ' '
      : t('teaser.author.text', {
          authors: authors.join(t('teaser.author.seperator')),
        })
      }
    </Typography>
  );
};
