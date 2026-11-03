import { useMutation } from '@apollo/client/react';
import {
  CreateNavigationDocument,
  NavigationDocument,
  NavigationListDocument,
  UpdateNavigationDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreateNavigation } from '@wepublish/permissions';

import { fromNavigation, toNavigationVariables } from './navigation.schema';
import { navigationRoutes, navigationView } from './navigation.view';

const writePermissions = [CanCreateNavigation.id];

export function NavigationCreateForm() {
  const [createNavigation] = useMutation(CreateNavigationDocument, {
    refetchQueries: [NavigationListDocument],
  });
  const navigation = useCreateForm(navigationView, {
    title: 'navigation.panels.createNavigation',
    writePermissions,
    save: async values => {
      const { data } = await createNavigation({
        variables: toNavigationVariables(values),
      });

      return data?.createNavigation.id;
    },
  });

  return <FormDrawerPanel controller={navigation} />;
}

type NavigationEditFormProps = {
  navigationId: string;
};

export function NavigationEditForm({ navigationId }: NavigationEditFormProps) {
  const load = useQueryLoader(NavigationDocument, { id: navigationId }, data =>
    fromNavigation(data.navigation)
  );
  const [updateNavigation] = useMutation(UpdateNavigationDocument);
  const navigation = useEditForm(navigationView, {
    title: 'navigation.panels.editNavigation',
    writePermissions,
    load,
    save: values =>
      updateNavigation({
        variables: { id: navigationId, ...toNavigationVariables(values) },
      }),
  });

  return <FormDrawerPanel controller={navigation} />;
}

export function NavigationDrawer() {
  const drawer = useRouteDrawer(navigationRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <NavigationEditForm
          key={drawer.id}
          navigationId={drawer.id}
        />
      : <NavigationCreateForm />}
    </FormDrawer>
  );
}
