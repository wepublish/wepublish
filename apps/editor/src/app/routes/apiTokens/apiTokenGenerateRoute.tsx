import { useMutation } from '@apollo/client/react';
import {
  ApiTokenListDocument,
  CreateApiTokenDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
} from '@wepublish/form/editor';
import { CanCreateApiToken } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { GeneratedToken } from '../tokens/generatedToken';
import { grantableScopes, toCreateApiTokenVariables } from './apiToken.schema';
import { apiTokenRoutes, apiTokenView } from './apiToken.view';

const writePermissions = [CanCreateApiToken.id];

export function ApiTokenGenerateForm() {
  const { t } = useTranslation();
  const { session } = useContext(AuthContext);
  const [token, setToken] = useState<string | null>(null);
  const [createApiToken] = useMutation(CreateApiTokenDocument, {
    refetchQueries: [ApiTokenListDocument],
  });
  const apiToken = useCreateForm(apiTokenView, {
    title: 'apiTokenList.panels.generateToken',
    submitLabel: 'apiTokenList.panels.generate',
    writePermissions,
    fields: {
      scopes: { options: grantableScopes(session?.sessionRoles) },
    },
    result:
      token === null ? null : (
        <GeneratedToken
          token={token}
          created={t('apiTokenList.panels.creationSuccess')}
          copy={t('apiTokenList.panels.copy')}
          copied={t('apiTokenList.panels.copied')}
          warning={t('apiTokenList.panels.tokenWarning')}
        />
      ),
    save: async values => {
      const { data } = await createApiToken({
        variables: toCreateApiTokenVariables(values),
      });

      setToken(data?.createApiToken.token ?? null);

      return null;
    },
  });

  return <FormDrawerPanel controller={apiToken} />;
}

export function ApiTokenGenerateRoute() {
  const navigate = useNavigate();

  return (
    <FormDrawer
      open
      onClose={() => navigate(apiTokenRoutes.list)}
      width="sm"
    >
      <ApiTokenGenerateForm />
    </FormDrawer>
  );
}
