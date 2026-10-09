import styled from '@emotion/styled';
import { Button, Card as MuiCard, CardContent, Drawer } from '@mui/material';
import InnerHTML from 'dangerously-set-html-content';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { DRAWER_WIDTHS } from '../drawer';
import { HtmlEditPanel } from '../panel/htmlEditPanel';
import { HTMLBlockValue } from './types';

const Panel = styled(MuiCard, {
  shouldForwardProp: prop => prop !== 'isEmpty',
})<{ isEmpty: boolean }>`
  display: grid;
  height: ${({ isEmpty }) => (isEmpty ? '200px' : undefined)};
  padding: 0;
  overflow: hidden;
  background-color: var(--rs-bg-well);
`;

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`;

const InnerHtmlWrapper = styled.div`
  min-height: 50px;
  margin-top: 20px;
`;

export const HTMLBlock = ({
  value,
  onChange,
  autofocus,
}: BlockProps<HTMLBlockValue>) => {
  const [isHtmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const isEmpty = !value.html;
  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus && isEmpty) {
      setHtmlDialogOpen(true);
    }
  }, []);

  const correctScript = () => {
    if (value.html.includes('/>')) {
      return value.html.replace('/>', '></script>');
    }
    return value.html;
  };

  return (
    <>
      <Panel isEmpty={isEmpty}>
        <CardContent>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <PlaceholderInput
              onAddClick={() => setHtmlDialogOpen(true)}
              addLabel={t('blocks.html.edit')}
            >
              {!isEmpty && (
                <Wrapper>
                  <IconWrapper>
                    <Button
                      variant="outlined"
                      startIcon={<MdEdit />}
                      size="large"
                      onClick={() => setHtmlDialogOpen(true)}
                    >
                      {t('blocks.html.edit')}
                    </Button>
                  </IconWrapper>

                  <InnerHtmlWrapper>
                    <InnerHTML html={correctScript()} />
                  </InnerHtmlWrapper>
                </Wrapper>
              )}
            </PlaceholderInput>
          </CardContent>
        </CardContent>
      </Panel>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
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
