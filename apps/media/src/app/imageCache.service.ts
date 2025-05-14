import NodeCache from 'node-cache'
import {Injectable} from '@nestjs/common'

type KeyCacheMeta = {
  size: number
  httpStatusCode: number
  lastAccessed: number
}

@Injectable()
export class ImageCacheService {
  private cache = new NodeCache({
    checkperiod: 60,
    deleteOnExpire: true,
    useClones: true,
    stdTTL: 300
  }) // Cleanup every 5 min

  public maxCacheSizeMB = parseInt(process.env['MAX_MEM_CACHE_SIZE_MB']) || 512
  public maxCacheItems = parseInt(process.env['MAX_MEM_CACHE_ITEMS']) || 10000

  private currentCacheSizeBytes = 0
  private totalHits = 0
  private totalMisses = 0
  private ttlResets = 0
  private evictions = 0
  private keyMeta = new Map<string, KeyCacheMeta>() // Track individual sizes

  constructor() {
    this.cache.on('del', key => this.removeKeySize(key))
    this.cache.on('expired', key => {
      this.evictions++
      this.removeKeySize(key)
    })
  }

  private resetHitMissStat() {
    if (this.totalHits > 1000000 || this.totalMisses > 1000000) {
      this.totalMisses = this.totalMisses / 2
      this.totalHits = this.totalHits / 2
      this.ttlResets = this.ttlResets / 2
      this.evictions = this.evictions / 2
    }
  }

  private addMissStat() {
    this.totalMisses++
    this.resetHitMissStat()
  }

  private addHitStat() {
    this.totalHits++
    this.resetHitMissStat()
  }

  private removeKeySize(key: string) {
    const meta = this.keyMeta.get(key)
    const size = meta?.size
    if (size) {
      this.currentCacheSizeBytes -= size
      this.keyMeta.delete(key)
    }
  }

  public get(key: string): [Buffer | undefined, number | undefined] {
    const meta = this.keyMeta.get(key)

    if (!meta) {
      this.addMissStat()
      return [undefined, undefined]
    } else {
      this.addHitStat()
    }

    const now = Date.now()
    meta.lastAccessed = now

    const sizeKB = meta.size / 1024
    const newTTL = sizeKB > 200 ? 300 : 3600

    if (meta.httpStatusCode === 200 && newTTL * 0.2 > (this.cache.getTtl(key) - now) / 1000) {
      // If 80% of TTL is passed, refresh TTL
      this.ttlResets++
      this.cache.ttl(key, newTTL)
    }
    return [this.cache.get<Buffer>(key), meta.httpStatusCode]
  }

  public set(key: string, value: Buffer, httpStatusCode = 200, overrideTTL?: number) {
    const sizeBytes = value.length

    if (this.currentCacheSizeBytes + sizeBytes > this.maxCacheSizeMB * 1024 * 1024) {
      console.warn(
        `Cache size limit reached (${this.maxCacheSizeMB} MB). Skipping cache for key: ${key}`
      )
      return
    }

    if (this.cache.keys().length >= this.maxCacheItems) {
      console.warn(
        `Cache item count limit reached (${this.maxCacheItems} items). Skipping cache for key: ${key}`
      )
      return
    }

    const now = Date.now()

    // Adjust memory if key already exists
    const meta = this.keyMeta.get(key)
    const oldSize = meta?.size ?? 0
    this.currentCacheSizeBytes += sizeBytes - oldSize

    this.keyMeta.set(key, {size: sizeBytes, httpStatusCode: httpStatusCode, lastAccessed: now})

    const sizeKB = sizeBytes / 1024
    let ttl = sizeKB > 200 ? 300 : 3600
    if (overrideTTL) {
      ttl = overrideTTL
    }

    this.cache.set(key, value, ttl)
  }

  public delete(key: string) {
    this.removeKeySize(key)
    this.cache.del(key)
  }

  public state() {
    let healty = true
    if (
      this.cache.keys().length >= this.maxCacheItems ||
      this.currentCacheSizeBytes > this.maxCacheSizeMB * 1024 * 1024
    ) {
      healty = false
    }
    return {
      healty,
      stats: {
        maxCacheItems: this.maxCacheItems,
        maxCacheSizeMb: this.maxCacheSizeMB,
        usedCacheItems: this.cache.keys().length,
        usedCacheSizeMb: Math.ceil(this.currentCacheSizeBytes / 1024 / 1024),
        freeCacheItems: this.maxCacheItems - this.cache.keys().length,
        freeCacheSizeMb: Math.ceil(this.maxCacheSizeMB - this.currentCacheSizeBytes / 1024 / 1024),
        percentageFreeCacheItems: Math.ceil(this.cache.keys().length / this.maxCacheItems),
        percentageFreeSizeMb: Math.ceil(
          this.currentCacheSizeBytes / 1024 / 1024 / this.maxCacheSizeMB
        ),
        averageItemSizeKb: this.currentCacheSizeBytes / 1024 / this.cache.keys().length,
        totalHits: this.totalHits,
        totalMisses: this.totalMisses,
        hitRate: this.totalMisses / this.totalHits,
        ttlResets: this.ttlResets,
        evictions: this.evictions
      }
    }
  }

  private getCurrentMemoryUsageMB(): number {
    return +(this.currentCacheSizeBytes / (1024 * 1024)).toFixed(2)
  }

  private getCurrentItemCount(): number {
    return this.cache.keys().length
  }
}
