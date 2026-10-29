import styled from '@emotion/styled';
import { Drawer, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TypographicTextArea } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import {
  TeaserListConfigPanel,
  useTeaserTypeText,
} from '../panel/teaserListConfigPanel';
import { ContentForTeaser } from './teaserGridBlock';
import { TeaserListBlockValue } from './types';

const TeaserListBlockWrapper = styled.div`
  display: grid;
  gap: 8px;
`;

const TeaserGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const TeaserWrapper = styled('article')`
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
`;

export const TeaserListBlock = ({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<TeaserListBlockValue>) => {
  const focusRef = useRef<HTMLTextAreaElement>(null);
  const { filter, teasers, skip, sort, take, teaserType } = value;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  const teaserTypeText = useTeaserTypeText();

  const isEmpty = !teasers.length || !value.title;
  const teasersToDisplay = teasers.slice(0, 6);

  useEffect(() => {
    if (autofocus && isEmpty) {
      focusRef.current?.focus();
    }
  }, [autofocus, isEmpty]);

  return (
    <TeaserListBlockWrapper>
      <TypographicTextArea
        ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={value.title ?? ''}
        onChange={e => onChange({ ...value, title: e.target.value })}
      />

      <BlockPreviewCard
        isEmpty={false}
        inset
        emptyLabel={t('blocks.teaserList.edit')}
        editLabel={t('blocks.teaserList.edit')}
        onEdit={() => setIsDialogOpen(true)}
        title={t('blocks.teaserList.teaserType', {
          teaserType: teaserTypeText(teaserType),
        })}
        subtitle={[
          t('blocks.teaserList.take', { take }),
          t('blocks.teaserList.skip', { skip }),
          sort && t('blocks.teaserList.sort', { sort }),
          !!filter.tags?.length &&
            t('blocks.teaserList.tags', { tags: filter.tags.join(', ') }),
        ]
          .filter(Boolean)
          .join(' · ')}
        disabled={disabled}
      >
        {teasersToDisplay.length ?
          <TeaserGrid>
            {teasersToDisplay.map(([, teaser], index) => (
              <TeaserWrapper key={index}>
                <ContentForTeaser teaser={teaser} />
              </TeaserWrapper>
            ))}
          </TeaserGrid>
        : <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('blocks.teaserList.teasers', { count: 0 })}
          </Typography>
        }
      </BlockPreviewCard>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <TeaserListConfigPanel
          value={value}
          onClose={() => setIsDialogOpen(false)}
          onSelect={value => {
            setIsDialogOpen(false);
            onChange(value);
          }}
        />
      </Drawer>
    </TeaserListBlockWrapper>
  );
};
