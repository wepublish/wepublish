import styled from '@emotion/styled';
import { getApiClientV2, usePromptLazyQuery } from '@wepublish/editor/api-v2';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoFixHigh } from 'react-icons/md';
import {
  Button,
  Drawer,
  Form,
  Input as RInput,
  InputGroup,
  Loader,
  Message,
  Tooltip,
  Whisper,
} from 'rsuite';

import { HTMLBlockValue } from '../blocks/types';

const Warning = styled.div``;

const Input = styled(RInput)`
  width: 100%;
`;

const StyledDrawer = styled(Drawer.Body)`
  display: flex;
  flex-flow: column;
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
  const [promptAI, { loading: thinking, error, data: v0Data }] =
    usePromptLazyQuery({
      fetchPolicy: 'no-cache',
      client: getApiClientV2(),
    });

  const onGenerateHTML = useCallback(
    async (query: string) => {
      const chat = await promptAI({
        variables: {
          query: query.trim(),
          chatId: v0Data?.prompt.chatId,
        },
      });

      if (!chat.error) {
        setHtmlBlock({ ...htmlBlock, html: chat.data?.prompt.message ?? `` });
        setPrompt('');
      }
    },
    [htmlBlock, promptAI, v0Data?.prompt.chatId]
  );

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.html.edit')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance="primary"
            disabled={isEmpty}
            onClick={() => onConfirm(htmlBlock)}
          >
            {t('blocks.html.confirm')}
          </Button>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('blocks.html.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <StyledDrawer>
        <StyledForm onSubmit={() => onGenerateHTML(prompt)}>
          <div>
            <Form.ControlLabel>Generate your HTML via AI</Form.ControlLabel>

            <InputGroup inside>
              <Form.Control
                name="aiPrompt"
                value={prompt}
                onChange={setPrompt}
              />

              <Whisper
                placement="top"
                trigger="hover"
                speaker={
                  <Tooltip>{t('articleEditor.panels.slugifySeoTitle')}</Tooltip>
                }
              >
                <InputGroup.Button
                  type="submit"
                  disabled={thinking || !prompt}
                >
                  {thinking ?
                    <Loader size={'xs'} />
                  : <MdAutoFixHigh />}
                </InputGroup.Button>
              </Whisper>
            </InputGroup>
          </div>

          {error && (
            <Message
              showIcon
              type="error"
            >
              {error.message}
            </Message>
          )}

          {v0Data && (
            <Message
              showIcon
              type="success"
            >
              Successfully generated HTML and updated block. Chat history is
              saved and you can continue the chat.
            </Message>
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
