import { List } from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { typographySchema } from './schema';
import { TypographyListItem } from './typography-list-item';

type TypographyListProps = {
  name: string;
};

export const TypographyList = memo(({ name }: TypographyListProps) => {
  const { t } = useTranslation();

  const [openTypography, setOpenTypography] =
    useState<keyof z.infer<typeof typographySchema>>();

  const handleOpenTypography = useCallback(
    (type: typeof openTypography) => () =>
      setOpenTypography(oldType => (oldType === type ? undefined : type)),
    []
  );

  return (
    <List>
      <TypographyListItem
        name={`${name}.h1`}
        onOpen={handleOpenTypography('h1')}
        isOpen={openTypography === 'h1'}
      />

      <TypographyListItem
        name={`${name}.h2`}
        onOpen={handleOpenTypography('h2')}
        isOpen={openTypography === 'h2'}
      />

      <TypographyListItem
        name={`${name}.h3`}
        onOpen={handleOpenTypography('h3')}
        isOpen={openTypography === 'h3'}
      />

      <TypographyListItem
        name={`${name}.h4`}
        onOpen={handleOpenTypography('h4')}
        isOpen={openTypography === 'h4'}
      />

      <TypographyListItem
        name={`${name}.h5`}
        onOpen={handleOpenTypography('h5')}
        isOpen={openTypography === 'h5'}
      />

      <TypographyListItem
        name={`${name}.h6`}
        onOpen={handleOpenTypography('h6')}
        isOpen={openTypography === 'h6'}
      />

      <TypographyListItem
        name={`${name}.body1`}
        onOpen={handleOpenTypography('body1')}
        isOpen={openTypography === 'body1'}
      />

      <TypographyListItem
        name={`${name}.body2`}
        onOpen={handleOpenTypography('body2')}
        isOpen={openTypography === 'body2'}
      />

      <TypographyListItem
        name={`${name}.caption`}
        onOpen={handleOpenTypography('caption')}
        isOpen={openTypography === 'caption'}
      />

      <TypographyListItem
        name={`${name}.teaserPretitle`}
        onOpen={handleOpenTypography('teaserPretitle')}
        isOpen={openTypography === 'teaserPretitle'}
      />

      <TypographyListItem
        name={`${name}.teaserTitle`}
        onOpen={handleOpenTypography('teaserTitle')}
        isOpen={openTypography === 'teaserTitle'}
      />

      <TypographyListItem
        name={`${name}.teaserLead`}
        onOpen={handleOpenTypography('teaserLead')}
        isOpen={openTypography === 'teaserLead'}
      />

      <TypographyListItem
        name={`${name}.teaserMeta`}
        onOpen={handleOpenTypography('teaserMeta')}
        isOpen={openTypography === 'teaserMeta'}
      />

      <TypographyListItem
        name={`${name}.articleAuthors`}
        onOpen={handleOpenTypography('articleAuthors')}
        isOpen={openTypography === 'articleAuthors'}
      />

      <TypographyListItem
        name={`${name}.peerInformation`}
        onOpen={handleOpenTypography('peerInformation')}
        isOpen={openTypography === 'peerInformation'}
      />

      <TypographyListItem
        name={`${name}.bannerTitle`}
        onOpen={handleOpenTypography('bannerTitle')}
        isOpen={openTypography === 'bannerTitle'}
      />

      <TypographyListItem
        name={`${name}.bannerText`}
        onOpen={handleOpenTypography('bannerText')}
        isOpen={openTypography === 'bannerText'}
      />

      <TypographyListItem
        name={`${name}.bannerCta`}
        onOpen={handleOpenTypography('bannerCta')}
        isOpen={openTypography === 'bannerCta'}
      />

      <TypographyListItem
        name={`${name}.blockBreakTitle`}
        onOpen={handleOpenTypography('blockBreakTitle')}
        isOpen={openTypography === 'blockBreakTitle'}
      />

      <TypographyListItem
        name={`${name}.blockBreakBody`}
        onOpen={handleOpenTypography('blockBreakBody')}
        isOpen={openTypography === 'blockBreakBody'}
      />

      <TypographyListItem
        name={`${name}.blockTitlePreTitle`}
        onOpen={handleOpenTypography('blockTitlePreTitle')}
        isOpen={openTypography === 'blockTitlePreTitle'}
      />

      <TypographyListItem
        name={`${name}.blockQuote`}
        onOpen={handleOpenTypography('blockQuote')}
        isOpen={openTypography === 'blockQuote'}
      />
    </List>
  );
});
