import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import InnerHTML from 'dangerously-set-html-content';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import { HtmlEditPanel } from '../panel/htmlEditPanel';
import { HTMLBlockValue } from './types';

const HtmlPreview = styled('div')`
  min-height: 50px;
  overflow: auto;
`;

export const HTMLBlock = ({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<HTMLBlockValue>) => {
  const isEmpty = !value.html;
  const { t } = useTranslation();
  const [isHtmlDialogOpen, setHtmlDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  const correctScript = () => {
    if (value.html.includes('/>')) {
      return value.html.replace('/>', '></script>');
    }
    return value.html;
  };

  return (
    <>
      <BlockPreviewCard
        isEmpty={isEmpty}
        emptyLabel={t('blocks.html.edit')}
        editLabel={t('blocks.html.edit')}
        onEdit={() => setHtmlDialogOpen(true)}
        title={t('blocks.html.label')}
        disabled={disabled}
      >
        <HtmlPreview>
          <InnerHTML html={correctScript()} />
        </HtmlPreview>
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
        open={isHtmlDialogOpen}
        onClose={() => setHtmlDialogOpen(false)}
      >
        <HtmlEditPanel
          value={value}
          onClose={() => setHtmlDialogOpen(false)}
          onConfirm={value => {
            setHtmlDialogOpen(false);
            onChange(value);
          }}
        />
      </Drawer>
    </>
  );
};
