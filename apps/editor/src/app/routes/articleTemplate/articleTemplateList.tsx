import {
  ArticleTemplateListDocument,
  DeleteArticleTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';

import { TemplateList } from '../templates/templateList';

function ArticleTemplateList() {
  return (
    <TemplateList
      listDocument={ArticleTemplateListDocument}
      deleteDocument={DeleteArticleTemplateDocument}
      selectTemplates={data => data?.articleTemplates}
      basePath="/articles/templates"
      permissions={{
        create: CanCreateArticleTemplate.id,
        delete: CanDeleteArticleTemplate.id,
      }}
      i18nPrefix="articleTemplates"
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateArticleTemplate.id,
  CanUpdateArticleTemplate.id,
  CanDeleteArticleTemplate.id,
])(ArticleTemplateList);

export { CheckedPermissionComponent as ArticleTemplateList };
