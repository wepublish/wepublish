import {action, getter, Module, mutation, VuexModule} from 'vuex-class-component'
import {FetchPolicy} from 'apollo-client'
import {WepPublicationTypeName} from '~/sdk/wep/interfacesAndTypes/WePublish'

/**
 * This store module manages the fetch-policy for api requests with apollo.
 * The action "getFetchPolicy" forces apollo to re-load its content from api (network-only) after half an hour
 * instead serving from cache.
 * Example of implementation in PageService.ts > getPage() or in ArticleService.ts > getArticle()
 */

type WepPublicationNameWithPeer = WepPublicationTypeName | 'PeerArticle'

export interface CacheIdentification {
  type: WepPublicationNameWithPeer
  id: string
}

type CacheEntry = CacheIdentification & {lastFetch: Date}

@Module({namespacedPath: 'cacheGuard/', target: 'nuxt'})
export class CacheGuard extends VuexModule {
  @getter cacheEntries: CacheEntry[] = []

  @mutation
  replaceOrPushCacheEntry(cacheEntry: CacheEntry) {
    const cacheEntryIndex = this.cacheEntries.findIndex(
      tmpEntry => tmpEntry.type === cacheEntry.type && tmpEntry.id === cacheEntry.id
    )
    if (cacheEntryIndex < 0) {
      this.cacheEntries.push(cacheEntry)
    } else {
      this.cacheEntries[cacheEntryIndex] = cacheEntry
    }
  }

  @action
  public async getFetchPolicy({type, id}: CacheIdentification): Promise<FetchPolicy> {
    const halfAnHourInMs = 30 * 60 * 1000
    const now: Date = new Date()
    const cacheEntries: CacheEntry[] = this.$store.getters['cacheGuard/cacheEntries']
    const cacheEntry: CacheEntry | undefined = cacheEntries.find(
      entry => entry.type === type && entry.id === id
    )
    // not fetched yet or cache is outdated (too old)
    const lastFetch: Date | undefined = cacheEntry?.lastFetch
    if (!lastFetch || now.getTime() - lastFetch.getTime() > halfAnHourInMs) {
      this.$store.commit('cacheGuard/replaceOrPushCacheEntry', {
        id,
        type,
        lastFetch: now
      } as CacheEntry)
      return 'network-only'
    }
    // can be served from cache
    return 'cache-first'
  }
}
