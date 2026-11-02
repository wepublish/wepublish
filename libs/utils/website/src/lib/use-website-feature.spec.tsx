import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import { FeaturesDocument } from '@wepublish/website/api';
import { ComponentProps, PropsWithChildren } from 'react';

import { useWebsiteFeature } from './use-website-feature';

type Mock = ComponentProps<typeof MockedProvider>['mocks'];

const wrapper =
  (mocks: Mock) =>
  ({ children }: PropsWithChildren) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

const featuresMock = (features: string[]) => [
  {
    request: { query: FeaturesDocument },
    result: { data: { features } },
  },
];

describe('useWebsiteFeature', () => {
  it('is false until the features are known', () => {
    const { result } = renderHook(
      () => useWebsiteFeature('profile-subscription-history'),
      { wrapper: wrapper(featuresMock(['profile-subscription-history'])) }
    );

    expect(result.current).toBe(false);
  });

  it('is true when the medium has the feature switched on', async () => {
    const { result } = renderHook(
      () => useWebsiteFeature('profile-subscription-history'),
      { wrapper: wrapper(featuresMock(['profile-subscription-history'])) }
    );

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is false when the medium does not have the feature', async () => {
    const { result } = renderHook(
      () => useWebsiteFeature('profile-subscription-history'),
      { wrapper: wrapper(featuresMock(['newsletter-editor'])) }
    );

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('is false when the features cannot be read', async () => {
    const { result } = renderHook(
      () => useWebsiteFeature('profile-subscription-history'),
      {
        wrapper: wrapper([
          {
            request: { query: FeaturesDocument },
            error: new Error('Not authenticated'),
          },
        ]),
      }
    );

    await waitFor(() => expect(result.current).toBe(false));
  });
});
