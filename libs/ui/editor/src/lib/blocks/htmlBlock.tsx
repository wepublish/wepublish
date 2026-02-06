import styled from '@emotion/styled';
import InnerHTML from 'dangerously-set-html-content';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Drawer, IconButton, Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { HtmlEditPanel } from '../panel/htmlEditPanel';
import { HTMLBlockValue } from './types';

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'isEmpty',
})<{ isEmpty: boolean }>`
  display: grid;
  height: ${({ isEmpty }) => (isEmpty ? '200px' : undefined)};
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
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
      <Panel
        isEmpty={isEmpty}
        bodyFill
        bordered
      >
        <PlaceholderInput onAddClick={() => setHtmlDialogOpen(true)}>
          {!isEmpty && (
            <Wrapper>
              <IconWrapper>
                <IconButton
                  size="lg"
                  icon={<MdEdit />}
                  onClick={() => setHtmlDialogOpen(true)}
                >
                  {t('blocks.html.edit')}
                </IconButton>
              </IconWrapper>

              <InnerHtmlWrapper>
                <InnerHTML html={correctScript()} />
              </InnerHtmlWrapper>
            </Wrapper>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer
        size="sm"
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
