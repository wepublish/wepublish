import { ArticleTemplateListDocument } from '@wepublish/editor/api';

import { CreateFromTemplateModal } from '../templates/createFromTemplateModal';

type CreateArticleModalProps = {
  open: boolean;
  onClose(): void;
};

export function CreateArticleModal(props: CreateArticleModalProps) {
  return (
    <CreateFromTemplateModal
      {...props}
      listDocument={ArticleTemplateListDocument}
      selectTemplates={data => data?.articleTemplates.nodes}
      createPath="/articles/create"
      i18nPrefix="articles.createModal"
    />
  );
}
