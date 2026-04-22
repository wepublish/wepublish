import { List } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { typographySchema } from './schema';
import { TypographyListItem } from './typography-list-item';

type TypographyListProps = {
  name: string;
  defaultValue: z.infer<typeof typographySchema>;
};

export const TypographyList = ({ name, defaultValue }: TypographyListProps) => {
  const { t } = useTranslation();

  const [openTypography, setOpenTypography] =
    useState<keyof z.infer<typeof typographySchema>>();

  const handleOpenTypography = (type: typeof openTypography) => () =>
    setOpenTypography(oldType => (oldType === type ? undefined : type));

  return (
    <List>
      <TypographyListItem
        name={`${name}.h1`}
        defaultValue={defaultValue.h1}
        onOpen={handleOpenTypography('h1')}
        isOpen={openTypography === 'h1'}
      />

      <TypographyListItem
        name={`${name}.h2`}
        defaultValue={defaultValue.h2}
        onOpen={handleOpenTypography('h2')}
        isOpen={openTypography === 'h2'}
      />

      <TypographyListItem
        name={`${name}.h3`}
        defaultValue={defaultValue.h3}
        onOpen={handleOpenTypography('h3')}
        isOpen={openTypography === 'h3'}
      />

      <TypographyListItem
        name={`${name}.h4`}
        defaultValue={defaultValue.h4}
        onOpen={handleOpenTypography('h4')}
        isOpen={openTypography === 'h4'}
      />

      <TypographyListItem
        name={`${name}.h5`}
        defaultValue={defaultValue.h5}
        onOpen={handleOpenTypography('h5')}
        isOpen={openTypography === 'h5'}
      />

      <TypographyListItem
        name={`${name}.h6`}
        defaultValue={defaultValue.h6}
        onOpen={handleOpenTypography('h6')}
        isOpen={openTypography === 'h6'}
      />

      <TypographyListItem
        name={`${name}.body1`}
        defaultValue={defaultValue.body1}
        onOpen={handleOpenTypography('body1')}
        isOpen={openTypography === 'body1'}
      />

      <TypographyListItem
        name={`${name}.body2`}
        defaultValue={defaultValue.body2}
        onOpen={handleOpenTypography('body2')}
        isOpen={openTypography === 'body2'}
      />

      <TypographyListItem
        name={`${name}.caption`}
        defaultValue={defaultValue.caption}
        onOpen={handleOpenTypography('caption')}
        isOpen={openTypography === 'caption'}
      />

      <TypographyListItem
        name={`${name}.teaserPretitle`}
        defaultValue={defaultValue.teaserPretitle}
        onOpen={handleOpenTypography('teaserPretitle')}
        isOpen={openTypography === 'teaserPretitle'}
      />

      <TypographyListItem
        name={`${name}.teaserTitle`}
        defaultValue={defaultValue.teaserTitle}
        onOpen={handleOpenTypography('teaserTitle')}
        isOpen={openTypography === 'teaserTitle'}
      />

      <TypographyListItem
        name={`${name}.teaserLead`}
        defaultValue={defaultValue.teaserLead}
        onOpen={handleOpenTypography('teaserLead')}
        isOpen={openTypography === 'teaserLead'}
      />

      <TypographyListItem
        name={`${name}.teaserMeta`}
        defaultValue={defaultValue.teaserMeta}
        onOpen={handleOpenTypography('teaserMeta')}
        isOpen={openTypography === 'teaserMeta'}
      />

      <TypographyListItem
        name={`${name}.articleAuthors`}
        defaultValue={defaultValue.articleAuthors}
        onOpen={handleOpenTypography('articleAuthors')}
        isOpen={openTypography === 'articleAuthors'}
      />

      <TypographyListItem
        name={`${name}.peerInformation`}
        defaultValue={defaultValue.peerInformation}
        onOpen={handleOpenTypography('peerInformation')}
        isOpen={openTypography === 'peerInformation'}
      />

      <TypographyListItem
        name={`${name}.bannerTitle`}
        defaultValue={defaultValue.bannerTitle}
        onOpen={handleOpenTypography('bannerTitle')}
        isOpen={openTypography === 'bannerTitle'}
      />

      <TypographyListItem
        name={`${name}.bannerText`}
        defaultValue={defaultValue.bannerText}
        onOpen={handleOpenTypography('bannerText')}
        isOpen={openTypography === 'bannerText'}
      />

      <TypographyListItem
        name={`${name}.bannerCta`}
        defaultValue={defaultValue.bannerCta}
        onOpen={handleOpenTypography('bannerCta')}
        isOpen={openTypography === 'bannerCta'}
      />

      <TypographyListItem
        name={`${name}.blockBreakTitle`}
        defaultValue={defaultValue.blockBreakTitle}
        onOpen={handleOpenTypography('blockBreakTitle')}
        isOpen={openTypography === 'blockBreakTitle'}
      />

      <TypographyListItem
        name={`${name}.blockBreakBody`}
        defaultValue={defaultValue.blockBreakBody}
        onOpen={handleOpenTypography('blockBreakBody')}
        isOpen={openTypography === 'blockBreakBody'}
      />

      <TypographyListItem
        name={`${name}.blockTitlePreTitle`}
        defaultValue={defaultValue.blockTitlePreTitle}
        onOpen={handleOpenTypography('blockTitlePreTitle')}
        isOpen={openTypography === 'blockTitlePreTitle'}
      />

      <TypographyListItem
        name={`${name}.blockQuote`}
        defaultValue={defaultValue.blockQuote}
        onOpen={handleOpenTypography('blockQuote')}
        isOpen={openTypography === 'blockQuote'}
      />
    </List>
  );
};
