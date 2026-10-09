import styled from '@emotion/styled';
import {
  Button,
  Card as MuiCard,
  CardContent,
  Drawer,
  IconButton as MuiIconButton,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { TypographicTextArea } from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
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

const TeaserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 16px;
`;

const TeaserWrapper = styled('article')`
  position: relative;
  min-height: 250px;
  overflow: hidden;
  border-radius: var(--rs-radius-md);
  background-color: var(--rs-bg-well);
`;

const PreviewPanel = styled(MuiCard)`
  overflow: hidden;
  background-color: var(--rs-bg-well);
  display: grid;
  position: relative;
`;

const Count = styled.p`
  text-align: center;
`;

const IconButton = styled(MuiIconButton)`
  position: absolute;
  right: 0;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 12px;
`;

export const TeaserListBlock = ({
  value,
  onChange,
  autofocus,
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

      <PreviewPanel>
        <CardContent>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
              <Button
                variant="outlined"
                startIcon={<MdEdit />}
                size="large"
                onClick={() => setIsDialogOpen(true)}
              >
                {t('blocks.teaserList.edit')}
              </Button>

              <InfoList>
                <li>
                  {t('blocks.teaserList.teaserType', {
                    teaserType: teaserTypeText(teaserType),
                  })}
                </li>
                <li>{t('blocks.teaserList.take', { take })}</li>
                <li>{t('blocks.teaserList.skip', { skip })}</li>
                {!!sort && <li>{t('blocks.teaserList.sort', { sort })}</li>}
                {!!filter.tags?.length && (
                  <li>
                    {t('blocks.teaserList.tags', {
                      tags: filter.tags.join(', '),
                    })}
                  </li>
                )}
              </InfoList>
            </PlaceholderInput>
          </CardContent>
        </CardContent>
      </PreviewPanel>

      <Count>
        {t('blocks.teaserList.teasers', {
          count: teasers.length ? teasers.length : 0,
        })}
      </Count>

      {!!teasersToDisplay.length && (
        <TeaserGrid>
          {teasersToDisplay.map(([, teaser], index) => (
            <TeaserWrapper key={index}>
              <ContentForTeaser teaser={teaser} />
            </TeaserWrapper>
          ))}
        </TeaserGrid>
      )}

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.lg,
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
