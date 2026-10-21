import type { Command } from '@wepublish/ui/editor';
import type { i18n as I18n, TFunction } from 'i18next';

import { AVAILABLE_LANG } from '../base';
import type { CommandDefinition } from './commandDefinition';

const searchAliases = (i18n: I18n, titleKey: string) => [
  ...new Set(AVAILABLE_LANG.map(({ id }) => i18n.getFixedT(id)(titleKey))),
];

export const toCommand =
  (group: Command['group'], t: TFunction, i18n: I18n) =>
  (definition: CommandDefinition): Command => ({
    id: definition.id,
    group: definition.favourite ? 'favourite' : group,
    title: t(definition.titleKey),
    section: definition.sectionKey ? t(definition.sectionKey) : undefined,
    keywords: searchAliases(i18n, definition.titleKey),
    icon: definition.icon,
    permissions: definition.permissions,
    feature: definition.feature,
    perform: definition.perform,
  });
