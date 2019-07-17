import fs from 'fs'
import path from 'path'

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

      fs.promises.mkdir(path.dirname(this.filename), {recursive: true})
      fs.promises.writeFile(this.filename, output, 'utf-8')
    })
  }
}
