import { useMutation } from '@apollo/client/react';
import {
  type AuthorQuery,
  AuthorDocument,
  AuthorListDocument,
  CreateAuthorDocument,
  UpdateAuthorDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreateAuthor } from '@wepublish/permissions';

import {
  fromAuthor,
  toCreateAuthorVariables,
  toUpdateAuthorVariables,
} from './author.schema';
import { authorRoutes, authorView } from './author.view';

const writePermissions = [CanCreateAuthor.id];

const loadedAuthor = ({ author }: AuthorQuery) => {
  if (author === null) {
    throw new Error('');
  }

  return fromAuthor(author);
};

export function AuthorCreateForm() {
  const [createAuthor] = useMutation(CreateAuthorDocument, {
    refetchQueries: [AuthorListDocument],
  });
  const author = useCreateForm(authorView, {
    title: 'authors.panels.createAuthor',
    writePermissions,
    save: async values => {
      const { data } = await createAuthor({
        variables: toCreateAuthorVariables(values),
      });

      return data?.createAuthor.id;
    },
  });

  return <FormDrawerPanel controller={author} />;
}

type AuthorEditFormProps = {
  authorId: string;
};

export function AuthorEditForm({ authorId }: AuthorEditFormProps) {
  const load = useQueryLoader(AuthorDocument, { id: authorId }, loadedAuthor);
  const [updateAuthor] = useMutation(UpdateAuthorDocument);
  const author = useEditForm(authorView, {
    title: 'authors.panels.editAuthor',
    writePermissions,
    load,
    save: values =>
      updateAuthor({ variables: toUpdateAuthorVariables(authorId, values) }),
  });

  return <FormDrawerPanel controller={author} />;
}

export function AuthorDrawer() {
  const drawer = useRouteDrawer(authorRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <AuthorEditForm
          key={drawer.id}
          authorId={drawer.id}
        />
      : <AuthorCreateForm />}
    </FormDrawer>
  );
}
