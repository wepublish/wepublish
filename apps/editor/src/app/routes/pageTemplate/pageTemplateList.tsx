import {
  PageTemplateListDocument,
  DeletePageTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePageTemplate,
  CanDeletePageTemplate,
  CanUpdatePageTemplate,
} from '@wepublish/permissions';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';

import { TemplateList } from '../templates/templateList';

function PageTemplateList() {
  return (
    <TemplateList
      listDocument={PageTemplateListDocument}
      deleteDocument={DeletePageTemplateDocument}
      selectTemplates={data => data?.pageTemplates}
      basePath="/pages/templates"
      permissions={{
        create: CanCreatePageTemplate.id,
        delete: CanDeletePageTemplate.id,
      }}
      i18nPrefix="pageTemplates"
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePageTemplate.id,
  CanUpdatePageTemplate.id,
  CanDeletePageTemplate.id,
])(PageTemplateList);

export { CheckedPermissionComponent as PageTemplateList };
