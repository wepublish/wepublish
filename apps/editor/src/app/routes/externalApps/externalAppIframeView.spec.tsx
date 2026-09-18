import { MockedProvider as MockedProviderBase } from '@apollo/client/testing';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import {
  CreateExternalAppTokenDocument,
  ExternalAppDocument,
  ExternalAppsTarget,
} from '@wepublish/editor/api';
import { actWait } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ExternalAppIframeView } from './externalAppIframeView';

const MockedProvider = MockedProviderBase as any;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

const APP_ID = 'app-1';
const APP_NAME = 'External App';

const externalAppMock = {
  request: {
    query: ExternalAppDocument,
    variables: { externalAppId: APP_ID },
  },
  result: () => ({
    data: {
      externalApp: {
        __typename: 'ExternalApp',
        createdAt: '2026-09-17T00:00:00.000Z',
        modifiedAt: '2026-09-17T00:00:00.000Z',
        icon: null,
        id: APP_ID,
        name: APP_NAME,
        description: null,
        target: ExternalAppsTarget.Iframe,
        url: 'https://external.example.com/login?lang=de',
      },
    },
  }),
};

const tokenMock = {
  request: {
    query: CreateExternalAppTokenDocument,
    variables: { externalAppId: APP_ID },
  },
  result: () => ({
    data: {
      createExternalAppToken: {
        __typename: 'ExternalAppToken',
        token: 'a-signed-token',
        expiresAt: '2026-09-17T04:00:00.000Z',
      },
    },
  }),
};

const renderView = (mocks: unknown[]) =>
  render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={[`/external-app/${APP_ID}`]}>
        <Routes>
          <Route
            path="/external-app/:id"
            element={<ExternalAppIframeView />}
          />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );

describe('ExternalAppIframeView', () => {
  test('shows the loading state and no iframe while the token is pending', async () => {
    renderView([externalAppMock, { ...tokenMock, delay: 1_000_000 }]);
    await actWait();

    expect(screen.queryByTitle(APP_NAME)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('passes the token to the iframe url without losing existing query params', async () => {
    renderView([externalAppMock, tokenMock]);
    await actWait();

    const iframe = await screen.findByTitle(APP_NAME);

    expect(iframe).toHaveAttribute(
      'src',
      'https://external.example.com/login?lang=de&token=a-signed-token'
    );
  });

  test('shows an error and no iframe when the token cannot be created', async () => {
    renderView([
      externalAppMock,
      { ...tokenMock, result: undefined, error: new Error('Token denied') },
    ]);
    await actWait();

    expect(await screen.findByText('Token denied')).toBeInTheDocument();
    expect(screen.queryByTitle(APP_NAME)).not.toBeInTheDocument();
  });
});
