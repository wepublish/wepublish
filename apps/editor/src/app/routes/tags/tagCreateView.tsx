import { useMutation } from '@apollo/client/react';
import { type TagType, CreateTagDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { CanCreateTag } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';

import { useWebsiteThemeColors } from '../website-settings/theme/theme-colors';
import { tagPaths, toCreateTagVariables } from './tag.schema';
import { tagView } from './tag.view';

const CREATE_PERMISSIONS = [CanCreateTag.id];

export type TagCreateViewProps = {
  type: TagType;
};

export const TagCreateForm = ({ type }: TagCreateViewProps) => {
  const presetColors = useWebsiteThemeColors();
  const [createTag] = useMutation(CreateTagDocument);
  const tag = useCreateForm(tagView, {
    title: 'tags.form.titleCreate',
    paths: tagPaths(type),
    fields: { color: { props: { presetColors } } },
    save: async values => {
      const { data } = await createTag({
        variables: toCreateTagVariables(type, values),
      });

      return data?.createTag.id;
    },
  });

  return <FormPage controller={tag} />;
};

export const TagCreateView = ({ type }: TagCreateViewProps) => (
  <PermissionControl
    qualifyingPermissions={CREATE_PERMISSIONS}
    showRejectionMessage
  >
    <TagCreateForm type={type} />
  </PermissionControl>
);
