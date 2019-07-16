import url from 'url'
import {Plugin, Compiler} from 'webpack'

export interface AssetListPluginOptions {
  filename: string
}

export class AssetListPlugin implements Plugin {
  private filename: string

  constructor(opts: AssetListPluginOptions) {
    this.filename = opts.filename
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapPromise('AssetListPlugin', async compilation => {
      const stats = compilation.getStats().toJson()

      // Webpack typings are incorrect.
      const assetByChunkName = ((stats.assetsByChunkName || {}) as unknown) as Record<
        string,
        string | string[]
      >

      const normalizedAssetByChunkName = Object.entries(assetByChunkName).reduce(
        (acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value : [value]
          return acc
        },
        {} as {[entry: string]: string[]}
      )

      const output = JSON.stringify(normalizedAssetByChunkName)

      compilation.assets[this.filename] = {
        size: () => Buffer.byteLength(output, 'utf-8'),
        source: () => output
      }
    })
  }
}
