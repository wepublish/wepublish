import { useMutation } from '@apollo/client/react';
import {
  CreatePeerDocument,
  PeerDocument,
  PeerListDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreatePeer } from '@wepublish/permissions';
import { useState } from 'react';

import {
  fromPeer,
  toCreatePeerVariables,
  toUpdatePeerVariables,
} from './peer.schema';
import { peerCreateView, peerEditView, peerRoutes } from './peer.view';
import { type StoredPeer, StoredPeerContext } from './remotePeerProfile';

const writePermissions = [CanCreatePeer.id];

export function PeerCreateForm() {
  const [createPeer] = useMutation(CreatePeerDocument, {
    refetchQueries: [PeerListDocument],
  });
  const peer = useCreateForm(peerCreateView, {
    title: 'peerList.panels.createPeer',
    writePermissions,
    save: async values => {
      const { data } = await createPeer({
        variables: toCreatePeerVariables(values),
      });

      return data?.createPeer.id;
    },
  });

  return <FormDrawerPanel controller={peer} />;
}

type PeerEditFormProps = {
  peerId: string;
};

export function PeerEditForm({ peerId }: PeerEditFormProps) {
  const [stored, setStored] = useState<StoredPeer | null>(null);
  const loadPeer = useQueryLoader(
    PeerDocument,
    { id: peerId },
    data => data.peer
  );
  const [updatePeer] = useMutation(UpdatePeerDocument);
  const peer = useEditForm(peerEditView, {
    title: 'peerList.panels.editPeer',
    writePermissions,
    load: async () => {
      const loaded = await loadPeer();

      if (loaded === null) {
        throw new Error('');
      }

      setStored({
        hostURL: loaded.hostURL,
        token: loaded.token,
        profile: loaded.profile,
      });

      return fromPeer(loaded);
    },
    save: values =>
      updatePeer({ variables: toUpdatePeerVariables(peerId, values) }),
  });

  return (
    <StoredPeerContext.Provider value={stored}>
      <FormDrawerPanel controller={peer} />
    </StoredPeerContext.Provider>
  );
}

export function PeerDrawer() {
  const drawer = useRouteDrawer(peerRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <PeerEditForm
          key={drawer.id}
          peerId={drawer.id}
        />
      : <PeerCreateForm />}
    </FormDrawer>
  );
}
