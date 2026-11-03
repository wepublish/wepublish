import { useMutation } from '@apollo/client/react';
import {
  PeerProfileDocument,
  UpdatePeerProfileDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useQueryLoader,
  useSingletonForm,
} from '@wepublish/form/editor';
import { CanUpdatePeerProfile } from '@wepublish/permissions';
import { useMatch, useNavigate } from 'react-router-dom';

import { peerRoutes } from './peer.view';
import { fromPeerProfile, toPeerProfileVariables } from './peerProfile.schema';
import { peerProfileView } from './peerProfile.view';

const writePermissions = [CanUpdatePeerProfile.id];

export function PeerProfileForm() {
  const load = useQueryLoader(PeerProfileDocument, {}, data =>
    fromPeerProfile(data.peerProfile)
  );
  const [updatePeerProfile] = useMutation(UpdatePeerProfileDocument, {
    refetchQueries: [PeerProfileDocument],
  });
  const profile = useSingletonForm(peerProfileView, {
    title: 'peerList.panels.editPeerInfo',
    writePermissions,
    load,
    save: values =>
      updatePeerProfile({ variables: toPeerProfileVariables(values) }),
  });

  return <FormDrawerPanel controller={profile} />;
}

export function PeerProfileDrawer() {
  const navigate = useNavigate();
  const open = useMatch(peerRoutes.profile) !== null;

  return (
    <FormDrawer
      open={open}
      onClose={() => navigate(peerRoutes.list)}
      width="md"
    >
      <PeerProfileForm />
    </FormDrawer>
  );
}
