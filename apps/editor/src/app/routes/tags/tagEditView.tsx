import { useMutation } from '@apollo/client/react';
import {
  type TagType,
  TagDocument,
  UpdateTagDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanGetTags, CanUpdateTag } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import { useWebsiteThemeColors } from '../website-settings/theme/theme-colors';
import {
  fromTag,
  tagPaths,
  tagTitleParams,
  toUpdateTagVariables,
} from './tag.schema';
import { tagView } from './tag.view';

const VIEW_PERMISSIONS = [CanGetTags.id, CanUpdateTag.id];

const WRITE_PERMISSIONS = [CanUpdateTag.id];

type TagEditFormProps = {
  id: string;
  type: TagType;
};

export const TagEditForm = ({ id, type }: TagEditFormProps) => {
  const presetColors = useWebsiteThemeColors();
  const load = useQueryLoader(TagDocument, { id }, data => fromTag(data.tag));
  const [updateTag] = useMutation(UpdateTagDocument);
  const tag = useEditForm(tagView, {
    title: 'tags.overview.editTag',
    titleParams: tagTitleParams,
    paths: tagPaths(type),
    writePermissions: WRITE_PERMISSIONS,
    load,
    fields: { color: { props: { presetColors } } },
    save: values => updateTag({ variables: toUpdateTagVariables(id, values) }),
  });

  return <FormPage controller={tag} />;
};

export type TagEditViewProps = {
  type: TagType;
};

export const TagEditView = ({ type }: TagEditViewProps) => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={VIEW_PERMISSIONS}
      showRejectionMessage
    >
      <TagEditForm
        key={id}
        id={id}
        type={type}
      />
    </PermissionControl>
  );
};
