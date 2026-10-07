import { renderHook } from '@testing-library/react';
import { SettingName } from '@wepublish/editor/api';
import { ArticleMetadata } from '@wepublish/ui/editor';

import { emptyArticleMetadata } from './articleDefaults';
import { useNewArticleDefaults } from './useNewArticleDefaults';

const useSettingsListQuery = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown, options?: unknown) =>
    operationName(document) === 'SettingsList' ?
      useSettingsListQuery(options)
    : undefined,
}));

const settings = {
  settings: [
    { name: SettingName.NewArticlePeering, value: true },
    { name: SettingName.NewArticlePaywall, value: 'paywall-1' },
  ],
};

const applyDefaults = (metadata: ArticleMetadata) => {
  const setMetadata = vi.fn();

  useSettingsListQuery.mockReturnValue({ data: settings });
  renderHook(() => useNewArticleDefaults(setMetadata));

  return setMetadata.mock.calls[0][0](metadata);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useNewArticleDefaults', () => {
  it('should apply the defaults for new articles', () => {
    expect(applyDefaults(emptyArticleMetadata)).toEqual({
      ...emptyArticleMetadata,
      shared: true,
      paywall: 'paywall-1',
    });
  });

  it('should keep metadata that has already been set', () => {
    expect(
      applyDefaults({
        ...emptyArticleMetadata,
        shared: false,
        paywall: 'paywall-2',
      })
    ).toEqual({
      ...emptyArticleMetadata,
      shared: false,
      paywall: 'paywall-2',
    });
  });

  it('should wait for the settings', () => {
    const setMetadata = vi.fn();
    useSettingsListQuery.mockReturnValue({ data: undefined });

    renderHook(() => useNewArticleDefaults(setMetadata));

    expect(setMetadata).not.toHaveBeenCalled();
  });

  it('should be skippable', () => {
    renderHook(() => useNewArticleDefaults(vi.fn(), { skip: true }));

    expect(useSettingsListQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });
});
