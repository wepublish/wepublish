import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import Peer from '~/sdk/wep/models/peer/Peer'

export default class PeerService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch peer from api.
   * @param id
   * @param slug
   * @param token
   */
  async getPeer({id, slug}: {id?: string; slug?: string}): Promise<Peer | false> {
    if (!id && !slug) {
      throw new Error('id nor slug is provided on getPeer() method within PeerService class.')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const query = gql`
        query Peer($slug: Slug, $id: ID) {
          peer(slug: $slug, id: $id) {
            ...peer
          }
        }
        ${Peer.peerFragment}
      `
      const response = await this.$apollo.query({
        query,
        variables: {
          id,
          slug
        },
        errorPolicy: 'all'
      })
      const peer = new Peer(response?.data?.peer)
      this.loadingFinish()
      return peer
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Peer konnte nicht geladen werden.',
        type: 'error'
      })
    }
    return false
  }
}
