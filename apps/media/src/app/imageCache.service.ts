import NodeCache from 'node-cache'
import {Injectable} from '@nestjs/common'

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
  private keySizes = new Map<string, number>() // Track individual sizes

  constructor() {
    this.cache.on('del', key => this.removeKeySize(key))
    this.cache.on('expired', key => this.removeKeySize(key))
  }

  private removeKeySize(key: string) {
    const size = this.keySizes.get(key)
    if (size) {
      this.currentCacheSizeBytes -= size
      this.keySizes.delete(key)
    }
  }

  public get(key: string): Buffer | undefined {
    return this.cache.get<Buffer>(key)
  }

  public set(key: string, value: Buffer) {
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

    // Adjust memory if key already exists
    const oldSize = this.keySizes.get(key) ?? 0
    this.currentCacheSizeBytes += sizeBytes - oldSize
    this.keySizes.set(key, sizeBytes)

    const sizeKB = sizeBytes / 1024
    const ttl = sizeKB > 200 ? 300 : 3600

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
        )
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
