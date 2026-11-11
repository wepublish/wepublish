/**
 * The tabs of Puck's left sidebar, in order.
 *
 * Puck puts its own «Blocks» and «Outline» first and appends ours. Naming one
 * of its own again moves it to where it is named, so they are listed here after
 * «Einstellungen» to put the settings on top. Without a label they keep Puck's.
 */
import type { Plugin } from '@puckeditor/core';
import { blocksPlugin, outlinePlugin } from '@puckeditor/core';
import type { TFunction } from 'i18next';
import { MdFactCheck, MdSettings } from 'react-icons/md';
import { ReportSection } from './report';
import { SettingsSection } from './settings';

/** The tab the editor opens on: settings sit on top, but blocks are the work. */
export const INITIAL_PLUGIN = 'blocks';

export const sidebarPlugins = (t: TFunction): Plugin[] => [
  {
    name: 'settings',
    label: t('newsletter.settings.heading'),
    icon: <MdSettings />,
    render: () => <SettingsSection />,
  },
  blocksPlugin(),
  outlinePlugin(),
  {
    name: 'report',
    label: t('newsletter.report.heading'),
    icon: <MdFactCheck />,
    render: () => <ReportSection />,
  },
];
