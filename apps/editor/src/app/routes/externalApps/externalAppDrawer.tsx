import { useMutation, useQuery } from '@apollo/client/react';
import {
  type ExternalAppApiTokenFragment,
  ApiTokenListDocument,
  ApiTokenStatus,
  CreateExternalAppDocument,
  ExternalAppDocument,
  ExternalAppsDocument,
  UpdateExternalAppDocument,
} from '@wepublish/editor/api';
import {
  type FormValues,
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import {
  CanCreateExternalApp,
  CanGetApiTokens,
  CanUpdateExternalApp,
} from '@wepublish/permissions';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type externalAppSchema,
  fromExternalApp,
  toExternalAppInput,
} from './externalApp.schema';
import { externalAppRoutes, externalAppView } from './externalApp.view';
import { type LinkedApiKey, LinkedApiKeyContext } from './linkedApiKeyWarning';

const createPermissions = [CanCreateExternalApp.id];
const updatePermissions = [CanUpdateExternalApp.id];

const noApiKeys: ExternalAppApiTokenFragment[] = [];

type ExternalAppValues = FormValues<typeof externalAppSchema>;

function useApiKeyField(linked: LinkedApiKey) {
  const { t } = useTranslation();
  const canLinkApiKey = useAuthorisation(CanGetApiTokens.id) === true;
  const { data } = useQuery(ApiTokenListDocument, {
    variables: { status: ApiTokenStatus.Active, take: 100 },
    skip: !canLinkApiKey,
  });
  const active = data?.apiTokens.nodes ?? noApiKeys;
  const apiKeys =
    linked !== null && !active.some(({ id }) => id === linked.id) ?
      [linked, ...active]
    : active;

  return {
    canLinkApiKey,
    field: {
      hidden: !canLinkApiKey,
      options: apiKeys.map(({ id, name, prefix }) => ({
        value: id,
        label: t('externalAppForm.apiKeyOption', { name, prefix }),
      })),
      helperText: ({ apiTokenId }: ExternalAppValues) => {
        const selected = apiKeys.find(({ id }) => id === apiTokenId);

        if (selected === undefined) {
          return undefined;
        }

        const details = t('externalAppForm.apiKeyDetails', {
          prefix: selected.prefix,
          scopes: selected.scopes.length,
          expiresAt: new Date(selected.expiresAt),
        });

        return <span>{details}</span>;
      },
    },
  };
}

export function ExternalAppCreateForm() {
  const apiKey = useApiKeyField(null);
  const [createExternalApp] = useMutation(CreateExternalAppDocument, {
    refetchQueries: [ExternalAppsDocument],
  });
  const externalApp = useCreateForm(externalAppView, {
    title: 'externalAppForm.createTitle',
    writePermissions: createPermissions,
    fields: { apiTokenId: apiKey.field },
    save: async values => {
      const { data } = await createExternalApp({
        variables: { input: toExternalAppInput(values, apiKey.canLinkApiKey) },
      });

      return data?.createExternalApp.id;
    },
  });

  return <FormDrawerPanel controller={externalApp} />;
}

type ExternalAppEditFormProps = {
  externalAppId: string;
};

export function ExternalAppEditForm({
  externalAppId,
}: ExternalAppEditFormProps) {
  const [linkedApiKey, setLinkedApiKey] = useState<LinkedApiKey>(null);
  const apiKey = useApiKeyField(linkedApiKey);
  const loadExternalApp = useQueryLoader(
    ExternalAppDocument,
    { externalAppId },
    data => data.externalApp
  );
  const [updateExternalApp] = useMutation(UpdateExternalAppDocument);
  const externalApp = useEditForm(externalAppView, {
    title: 'externalAppForm.editTitle',
    writePermissions: updatePermissions,
    fields: { apiTokenId: apiKey.field },
    load: async () => {
      const loaded = await loadExternalApp();

      setLinkedApiKey(loaded.apiToken);

      return fromExternalApp(loaded);
    },
    save: (values, { changedKeys }) => {
      const linkApiKey =
        apiKey.canLinkApiKey && changedKeys.includes('apiTokenId');

      return updateExternalApp({
        variables: {
          updateExternalAppId: externalAppId,
          ...toExternalAppInput(values, linkApiKey),
        },
      });
    },
  });

  return (
    <LinkedApiKeyContext.Provider value={linkedApiKey}>
      <FormDrawerPanel controller={externalApp} />
    </LinkedApiKeyContext.Provider>
  );
}

export function ExternalAppDrawer() {
  const drawer = useRouteDrawer(externalAppRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <ExternalAppEditForm
          key={drawer.id}
          externalAppId={drawer.id}
        />
      : <ExternalAppCreateForm />}
    </FormDrawer>
  );
}
