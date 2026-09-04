import { MockedProvider } from '@apollo/client/testing';
import { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentType } from 'react';
import { ZettelkastenSearchDocument } from '@wepublish/editor/api';

import { ZettelkastenPanel } from './zettelkasten-panel';

const mocks = [
  {
    request: {
      query: ZettelkastenSearchDocument,
      variables: { query: 'Conradin Cramer', limit: 20, offset: 0 },
    },
    result: {
      data: {
        zettelkastenSearch: {
          gesamt: 1,
          treffer: [
            {
              titel: 'Conradin Cramer',
              quelle: 'staatskalender.bs.ch/api',
              datum: '2026-08-25',
              reihe: 'personen',
              beleg: 'mandanten/bajour/wiki/personen/cramer_conradin.md',
              stelle: 'Regierungspräsident des Kantons Basel-Stadt.',
            },
          ],
        },
      },
    },
  },
];

export default {
  component: ZettelkastenPanel,
  title: 'Zettelkasten/Panel',
  decorators: [
    (Story: ComponentType) => (
      <MockedProvider
        addTypename={false}
        mocks={mocks}
      >
        <div style={{ width: 420, height: 600 }}>
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
} as Meta<typeof ZettelkastenPanel>;

export const Default: StoryObj<typeof ZettelkastenPanel> = {
  args: {
    anchors: ['Conradin Cramer', 'Stephanie Eymann'],
    onClose: () => undefined,
  },
};
