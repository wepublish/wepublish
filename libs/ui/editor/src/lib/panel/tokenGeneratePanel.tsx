import styled from '@emotion/styled';
import {
  TokenListDocument,
  useCreateTokenMutation,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Input,
  Message as RMessage,
  Panel,
  toaster,
} from 'rsuite';

import { createCheckedPermissionComponent } from '../atoms';
import { getOperationNameFromDocument } from '../utility';

const Message = styled(RMessage)`
  margin-top: 5px;
`;

export interface TokenGeneratePanelProps {
  onClose?(): void;
}

function TokenGeneratePanel({ onClose }: TokenGeneratePanelProps) {
  const [name, setName] = useState('');

  const [createToken, { data, loading: isCreating, error: createError }] =
    useCreateTokenMutation({
      refetchQueries: [getOperationNameFromDocument(TokenListDocument)],
    });

  const isDisabled = isCreating;
  const token = data?.createToken.token;
  const hasGeneratedToken = token !== undefined;

  const { t } = useTranslation();

  useEffect(() => {
    if (createError?.message)
      toaster.push(
        <RMessage
          type="error"
          showIcon
          closable
          duration={0}
        >
          {createError.message}
        </RMessage>
      );
  }, [createError]);

  async function handleSave() {
    await createToken({ variables: { name } });
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('tokenList.panels.generateToken')}</Drawer.Title>

        <Drawer.Actions>
          {!hasGeneratedToken && (
            <Button
              disabled={isDisabled}
              onClick={handleSave}
              appearance="primary"
            >
              {t('tokenList.panels.generate')}
            </Button>
          )}
          <Button
            onClick={() => onClose?.()}
            appearance="subtle"
          >
            {t('tokenList.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>
      <Drawer.Body>
        {token ?
          <>
            <p>{t('tokenList.panels.creationSuccess')}</p>
            <Panel bordered>{token}</Panel>
            <Message
              showIcon
              type="warning"
            >
              {t('tokenList.panels.tokenWarning')}
            </Message>
          </>
        : <Input
            placeholder={t('tokenList.panels.name')}
            value={name}
            disabled={isDisabled}
            onChange={value => {
              setName(value);
            }}
          />
        }
      </Drawer.Body>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_TOKEN',
])(TokenGeneratePanel);
export { CheckedPermissionComponent as TokenGeneratePanel };
