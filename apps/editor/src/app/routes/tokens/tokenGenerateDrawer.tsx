import { useMutation } from '@apollo/client/react';
import { CreateTokenDocument, TokenListDocument } from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
} from '@wepublish/form/editor';
import { CanCreateToken } from '@wepublish/permissions';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch, useNavigate } from 'react-router-dom';

import { GeneratedToken } from './generatedToken';
import { toCreateTokenVariables } from './token.schema';
import { tokenRoutes, tokenView } from './token.view';

const writePermissions = [CanCreateToken.id];

export function TokenGenerateForm() {
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [createToken] = useMutation(CreateTokenDocument, {
    refetchQueries: [TokenListDocument],
  });
  const generate = useCreateForm(tokenView, {
    title: 'tokenList.panels.generateToken',
    submitLabel: 'tokenList.panels.generate',
    writePermissions,
    result:
      token === null ? null : (
        <GeneratedToken
          token={token}
          created={t('tokenList.panels.creationSuccess')}
          copy={t('tokenList.panels.copy')}
          copied={t('tokenList.panels.copied')}
          warning={t('tokenList.panels.tokenWarning')}
        />
      ),
    save: async values => {
      const { data } = await createToken({
        variables: toCreateTokenVariables(values),
      });

      setToken(data?.createToken.token ?? null);

      return null;
    },
  });

  return <FormDrawerPanel controller={generate} />;
}

export function TokenGenerateDrawer() {
  const navigate = useNavigate();
  const open = useMatch(tokenRoutes.generate) !== null;

  return (
    <FormDrawer
      open={open}
      onClose={() => navigate(tokenRoutes.list)}
      width="sm"
    >
      <TokenGenerateForm />
    </FormDrawer>
  );
}
