import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';

import { AuthContext } from './authContext';
import {
  createCheckedFeatureComponent,
  FeatureControl,
  FeaturesProvider,
  useFeature,
} from './featureContext';

const featuresQueryMock = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    useQuery: (document: unknown, options?: unknown) =>
      operationName(document) === 'Features' ?
        featuresQueryMock(options)
      : (actual.useQuery as (...args: unknown[]) => unknown)(document, options),
  };
});

const loggedIn = { session: { email: 'karl@wepublish.ch', sessionToken: 't' } };

function Probe() {
  return <span>{useFeature('newsletter') ? 'on' : 'off'}</span>;
}

function renderWith(
  ui: React.ReactNode,
  { features, loading = false, auth = loggedIn } = {} as {
    features?: string[];
    loading?: boolean;
    auth?: typeof loggedIn | Record<string, never>;
  }
) {
  featuresQueryMock.mockReturnValue({
    data: features ? { features } : undefined,
    loading,
  });

  return render(
    <AuthContext.Provider value={auth}>
      <FeaturesProvider>{ui}</FeaturesProvider>
    </AuthContext.Provider>
  );
}

describe('useFeature', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is on when the medium has the feature', () => {
    renderWith(<Probe />, { features: ['newsletter'] });

    expect(screen.getByText('on')).toBeInTheDocument();
  });

  it('is off when the medium does not have it', () => {
    renderWith(<Probe />, { features: ['something-else'] });

    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('is off while the features are loading, so nothing flashes in', () => {
    renderWith(<Probe />, { loading: true });

    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('does not ask before someone is logged in', () => {
    renderWith(<Probe />, { auth: {} });

    expect(featuresQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('is off outside a FeaturesProvider', () => {
    render(<Probe />);

    expect(screen.getByText('off')).toBeInTheDocument();
  });
});

describe('FeatureControl', () => {
  it('renders its children when the feature is on', () => {
    renderWith(
      <FeatureControl feature="newsletter">
        <span>Newsletter menu</span>
      </FeatureControl>,
      { features: ['newsletter'] }
    );

    expect(screen.getByText('Newsletter menu')).toBeInTheDocument();
  });

  it('renders nothing when the feature is off', () => {
    renderWith(
      <FeatureControl feature="newsletter">
        <span>Newsletter menu</span>
      </FeatureControl>,
      { features: [] }
    );

    expect(screen.queryByText('Newsletter menu')).not.toBeInTheDocument();
  });
});

describe('createCheckedFeatureComponent', () => {
  const Page = ({ title }: { title: string }) => <h1>{title}</h1>;
  const GatedPage = createCheckedFeatureComponent('newsletter')(Page);

  it('renders the page with its props when the feature is on', () => {
    renderWith(<GatedPage title="Newsletter" />, { features: ['newsletter'] });

    expect(screen.getByRole('heading')).toHaveTextContent('Newsletter');
  });

  it('renders nothing when the feature is off', () => {
    renderWith(<GatedPage title="Newsletter" />, { features: [] });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
