import {UserInputError} from '../../error'
import {Context} from '../../context'

export const getPeerByIdOrSlug = (
  id: string | null,
  slug: string | null,
  peer: Context['loaders']['peer'],
  peerBySlug: Context['loaders']['peerBySlug']
) => {
  if ((!id && !slug) || (id && slug)) {
    throw new UserInputError('You must provide either `id` or `slug`.')
  }

  return id ? peer.load(id) : peerBySlug.load(slug!)
}
