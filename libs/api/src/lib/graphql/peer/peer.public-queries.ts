import {DisabledPeerError, UserInputError} from '../../error'
import {Context} from '../../context'

export const getPeerByIdOrSlug = async (
  id: string | null,
  slug: string | null,
  peerClient: Context['loaders']['peer'],
  peerBySlug: Context['loaders']['peerBySlug']
) => {
  if ((!id && !slug) || (id && slug)) {
    throw new UserInputError('You must provide either `id` or `slug`.')
  }

  const peer = id ? await peerClient.load(id) : await peerBySlug.load(slug!)

  if (peer?.isDisabled) {
    throw new DisabledPeerError()
  }

  return peer
}
