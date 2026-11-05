import { PageTemplateListDocument } from '@wepublish/editor/api';

import { CreateFromTemplateModal } from '../templates/createFromTemplateModal';

type CreatePageModalProps = {
  open: boolean;
  onClose(): void;
};

export function CreatePageModal(props: CreatePageModalProps) {
  return (
    <CreateFromTemplateModal
      {...props}
      listDocument={PageTemplateListDocument}
      selectTemplates={data => data?.pageTemplates.nodes}
      createPath="/pages/create"
      i18nPrefix="pages.createModal"
    />
  );
}
