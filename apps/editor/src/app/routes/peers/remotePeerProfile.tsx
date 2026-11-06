import type { ApolloClient } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import {
  type FullRemotePeerProfileFragment,
  type RemotePeerProfileQueryVariables,
  RemotePeerProfileDocument,
} from '@wepublish/editor/api';
import type { SectionComponentProps } from '@wepublish/form/editor';
import { toPlaintext } from '@wepublish/richtext';
import {
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  humanizeError,
} from '@wepublish/ui/editor';
import { createContext, useContext, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type StoredPeer = {
  readonly hostURL: string;
  readonly token: string;
  readonly profile: FullRemotePeerProfileFragment | null;
};

type ShownProfile = {
  readonly hostURL: string;
  readonly token: string;
  readonly profile: FullRemotePeerProfileFragment | null;
};

export const StoredPeerContext = createContext<StoredPeer | null>(null);

const Profile = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Logo = styled.img`
  display: block;
  max-width: 240px;
  max-height: 120px;
  object-fit: contain;
  object-position: left top;
`;

const Color = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Swatch = styled.span`
  width: 24px;
  height: 16px;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.5)`};
`;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

function storedProfile(stored: StoredPeer | null): ShownProfile | null {
  if (stored === null) {
    return null;
  }

  return { hostURL: stored.hostURL, token: '', profile: stored.profile };
}

function profileFor(
  shown: ShownProfile | null,
  hostURL: string,
  token: string
) {
  if (shown === null || shown.hostURL !== hostURL || shown.token !== token) {
    return null;
  }

  return shown.profile;
}

async function fetchRemoteProfile(
  client: ApolloClient,
  variables: RemotePeerProfileQueryVariables
) {
  try {
    const { data } = await client.query({
      query: RemotePeerProfileDocument,
      variables,
      fetchPolicy: 'network-only',
    });

    return data === undefined ? null : data.remotePeerProfile;
  } catch (error) {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });

    return undefined;
  }
}

function ColorValue({ color }: { readonly color: string }) {
  return (
    <Color>
      <Swatch style={{ backgroundColor: color }} />
      {color}
    </Color>
  );
}

function RemoteProfileDetails({
  profile,
}: {
  readonly profile: FullRemotePeerProfileFragment;
}) {
  const { t } = useTranslation();

  return (
    <Profile>
      <Logo
        src={profile.logo?.xl ?? '/static/placeholder-240x240.png'}
        alt=""
      />

      <DescriptionList>
        <DescriptionListItem label={t('peerList.panels.name')}>
          {profile.name}
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.themeColor')}>
          <ColorValue color={profile.themeColor} />
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.themeFontColor')}>
          <ColorValue color={profile.themeFontColor} />
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.callToActionText')}>
          {toPlaintext(profile.callToActionText?.content)}
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.callToActionURL')}>
          {profile.callToActionURL}
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.callToActionImage')}>
          {profile.callToActionImage?.xsSquare ?
            <img
              src={profile.callToActionImage.xsSquare}
              alt={t('peerList.panels.callToActionImage')}
            />
          : null}
        </DescriptionListItem>
        <DescriptionListItem label={t('peerList.panels.callToActionImageURL')}>
          {profile.callToActionImageURL}
        </DescriptionListItem>
      </DescriptionList>
    </Profile>
  );
}

export function RemotePeerProfile({ readOnly }: SectionComponentProps) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const stored = useContext(StoredPeerContext);
  const [hostURL, token] = useWatch({ name: ['hostURL', 'token'] });
  const [fetched, setFetched] = useState<ShownProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const current = { hostURL: text(hostURL), token: text(token) };
  const profile = profileFor(
    fetched ?? storedProfile(stored),
    current.hostURL,
    current.token
  );

  const fetchProfile = async () => {
    setFetching(true);

    const remote = await fetchRemoteProfile(client, {
      hostURL: current.hostURL,
      token: current.token || (stored === null ? '' : stored.token),
    });

    setFetching(false);

    if (remote !== undefined) {
      setFetched({ ...current, profile: remote });
    }
  };

  return (
    <>
      <div>
        <Button
          variant="outlined"
          loading={fetching}
          disabled={readOnly || current.hostURL === ''}
          onClick={fetchProfile}
        >
          {t('peerList.panels.getRemote')}
        </Button>
      </div>

      {profile === null ? null : <RemoteProfileDetails profile={profile} />}
    </>
  );
}
