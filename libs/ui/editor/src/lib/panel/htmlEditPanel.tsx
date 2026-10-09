import { useLazyQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Button, CircularProgress } from '@mui/material';
import { getApiClientV2, PromptHtmlDocument } from '@wepublish/editor/api';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoFixHigh } from 'react-icons/md';
import { Form, Input as RInput, InputGroup } from 'rsuite';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { HTMLBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { humanizeError } from '../humanizeError';

const Warning = styled.div``;

const Input = styled(RInput)`
  width: 100%;
`;

const StyledDrawer = styled(DrawerBody)`
  display: grid;
  grid-auto-rows: max-content;
  grid-gap: 20px;
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-flow: column;
  grid-gap: 8px;
`;

const HtmlContainer = styled.div`
  overflow-x: hidden;
`;

export interface HtmlEditPanelProps {
  readonly value: HTMLBlockValue;
  onClose(): void;
  onConfirm(value: HTMLBlockValue): void;
}

export function HtmlEditPanel({
  value,
  onClose,
  onConfirm,
}: HtmlEditPanelProps) {
  const [htmlBlock, setHtmlBlock] = useState<HTMLBlockValue>(value);
  const isEmpty = htmlBlock === undefined;
  const { t } = useTranslation();

  const [prompt, setPrompt] = useState('');
  const [promptHTML, { loading: thinking, error, data: v0Data }] = useLazyQuery(
    PromptHtmlDocument,
    {
      fetchPolicy: 'no-cache',
      client: getApiClientV2(),
    }
  );

  const onGenerateHTML = useCallback(
    async (query: string) => {
      const chat = await promptHTML({
        variables: {
          query: query.trim(),
          chatId: v0Data?.promptHTML.chatId,
        },
      });

      if (!chat.error) {
        setHtmlBlock(block => ({
          ...block,
          html: chat.data?.promptHTML.message ?? ``,
        }));
        setPrompt('');
      }
    },
    [promptHTML, v0Data?.promptHTML.chatId]
  );

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.html.edit')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="contained"
            disabled={isEmpty}
            onClick={() => onConfirm(htmlBlock)}
          >
            {t('blocks.html.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('blocks.html.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <StyledDrawer>
        <StyledForm onSubmit={() => onGenerateHTML(prompt)}>
          <div>
            <Form.Label>{t('blocks.html.generate')}</Form.Label>

            <InputGroup inside>
              <Form.Control
                name="aiPrompt"
                value={prompt}
                onChange={setPrompt}
              />

              <IconButtonTooltip caption={t('blocks.html.prompt')}>
                <InputGroup.Button
                  type="submit"
                  aria-label={t('blocks.html.prompt')}
                  disabled={thinking || !prompt}
                >
                  {thinking ?
                    <CircularProgress size={16} />
                  : <MdAutoFixHigh />}
                </InputGroup.Button>
              </IconButtonTooltip>
            </InputGroup>
          </div>

          {error && <Alert severity="error">{humanizeError(error)}</Alert>}

          {v0Data && (
            <Alert severity="success">{t('blocks.html.promptSuccess')}</Alert>
          )}
        </StyledForm>

        <Input
          as="textarea"
          rows={3}
          placeholder={t('blocks.html.placeholder')}
          value={htmlBlock.html}
          onChange={input => setHtmlBlock({ ...htmlBlock, html: input })}
        />

        <Warning>{t('blocks.html.warning')}</Warning>

        <HtmlContainer dangerouslySetInnerHTML={{ __html: htmlBlock.html }} />
      </StyledDrawer>
    </>
  );
}
