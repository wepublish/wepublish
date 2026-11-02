import { PuckDocumentController } from '@wepublish/puck-content/editor';
import { TFunction } from 'i18next';

import { templateNameOf } from './puck-template-mapping';

type PuckTemplateControllerOptions = Pick<
  PuckDocumentController,
  'backTo' | 'backLabel' | 'lastSavedAt' | 'isNew' | 'busy' | 'canSave'
> & {
  onSave: PuckDocumentController['onSave'];
};

export const puckTemplateController = (
  t: TFunction,
  options: PuckTemplateControllerOptions
): PuckDocumentController => ({
  ...options,
  status: 'none',
  statusLabel: t('puck.templates.status'),
  hasUnpublishedChanges: false,
  canPublish: false,
});

export const assertTemplateName = (t: TFunction, rootProps: unknown) => {
  if (!templateNameOf(rootProps)) {
    throw new Error(t('puck.templates.nameRequired'));
  }
};
