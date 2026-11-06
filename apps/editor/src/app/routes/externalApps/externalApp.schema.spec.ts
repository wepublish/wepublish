import {
  type ExternalAppFragment,
  ExternalAppsTarget,
} from '@wepublish/editor/api';

import {
  externalAppSchema,
  fromExternalApp,
  toExternalAppInput,
} from './externalApp.schema';

const druckliste: ExternalAppFragment = {
  __typename: 'ExternalApp',
  id: 'app-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Druckliste',
  description: 'Exports the print list',
  url: 'https://export.neuewege.ch/',
  target: ExternalAppsTarget.Iframe,
  icon: 'print',
  apiTokenId: 'key-1',
  apiToken: null,
};

const values = {
  name: 'Druckliste',
  description: 'Exports the print list',
  target: ExternalAppsTarget.Iframe,
  url: 'https://export.neuewege.ch/',
  icon: 'print',
  apiTokenId: 'key-1',
};

describe('external app schema', () => {
  it('loads the edited fields of an app', () => {
    expect(fromExternalApp(druckliste)).toStrictEqual(values);
  });

  it('loads an app without description, icon or API key as empty', () => {
    expect(
      fromExternalApp({
        ...druckliste,
        description: null,
        icon: null,
        apiTokenId: null,
      })
    ).toStrictEqual({ ...values, description: '', icon: '', apiTokenId: '' });
  });

  it('maps the values to the input with the linked API key', () => {
    expect(toExternalAppInput(values, true)).toStrictEqual({
      name: 'Druckliste',
      description: 'Exports the print list',
      url: 'https://export.neuewege.ch/',
      target: ExternalAppsTarget.Iframe,
      icon: 'print',
      apiTokenId: 'key-1',
    });
  });

  it('sends no API key as null so the API unlinks it', () => {
    expect(
      toExternalAppInput({ ...values, apiTokenId: '' }, true).apiTokenId
    ).toBeNull();
  });

  it('leaves the API key out when it must stay as it is', () => {
    expect(toExternalAppInput(values, false)).not.toHaveProperty('apiTokenId');
  });

  it('opens a new app in a new browser tab', () => {
    expect(
      externalAppSchema.parse({ ...values, target: undefined }).target
    ).toBe(ExternalAppsTarget.Blank);
  });

  it.each(['', 'export', 'neuewege.ch'])('rejects the URL "%s"', url => {
    expect(externalAppSchema.safeParse({ ...values, url }).success).toBe(false);
  });

  it('requires a name', () => {
    expect(
      externalAppSchema.safeParse({ ...values, name: '' }).success
    ).toBe(false);
  });
});
