import { screen } from '@testing-library/react';
import {
  mockPeer,
  mockRemotePeerProfile,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderPeerProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { PeerInformation } from './peer-information';

const profile = mockRemotePeerProfile({
  websiteURL: 'https://peer.example.com',
  callToActionURL: 'https://peer.example.com/abo',
  callToActionText: mockRichTextParagraph('Abonniere Peer'),
});
const peer = mockPeer({
  profile,
  information: mockRichTextParagraph('Dieser Artikel stammt von Peer.'),
});

const renderPeerInformation = (props: Partial<BuilderPeerProps> = {}) =>
  renderWithProviders(
    <PeerInformation
      {...peer}
      originUrl="https://peer.example.com/a/original"
      {...props}
    />
  );

describe('PeerInformation', () => {
  it('shows the information, the call to action and the link to the original', () => {
    renderPeerInformation();

    expect(
      screen.getByText('Dieser Artikel stammt von Peer.')
    ).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: 'Abonniere Peer' });
    expect(cta).toHaveAttribute('href', 'https://peer.example.com/abo');
    expect(cta).toHaveAttribute('target', '_blank');

    expect(
      screen.getByRole('link', { name: t('article.toOriginal') })
    ).toHaveAttribute('href', 'https://peer.example.com/a/original');
  });

  it('shows the call to action image', () => {
    const { container } = renderPeerInformation();

    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders no image without a call to action image', () => {
    const { container } = renderPeerInformation({
      profile: { ...profile, callToActionImage: null },
    });

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('links the call to action to the peer website without a call to action url', () => {
    renderPeerInformation({ profile: { ...profile, callToActionURL: '' } });

    expect(
      screen.getByRole('link', { name: 'Abonniere Peer' })
    ).toHaveAttribute('href', 'https://peer.example.com');
  });

  it('renders no empty call to action without a call to action text', () => {
    renderPeerInformation({ profile: { ...profile, callToActionText: null } });

    expect(screen.getAllByRole('link')).toEqual([
      screen.getByRole('link', { name: t('article.toOriginal') }),
    ]);
  });

  it('does not link to an original article without origin url', () => {
    renderPeerInformation({ originUrl: undefined });

    expect(
      screen.queryByRole('link', { name: t('article.toOriginal') })
    ).not.toBeInTheDocument();
  });

  it('renders nothing without a profile', () => {
    const { container } = renderPeerInformation({ profile: null });

    expect(container).toBeEmptyDOMElement();
  });
});
