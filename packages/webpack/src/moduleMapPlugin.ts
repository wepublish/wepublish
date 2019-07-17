// Copyright (c) 2018-present Jamie Kyle <me@thejameskyle.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Highly modifed version of:
// https://github.com/jamiebuilds/react-loadable/blob/master/src/webpack.js
import fs from 'fs'
import path from 'path'

import {Plugin, Compiler} from 'webpack'
import ConcatenatedModule from 'webpack/lib/optimize/ConcatenatedModule'

export interface ModuleMapPluginOptions {
  filename: string
}

export class ModuleMapPlugin implements Plugin {
  private filename: string

  constructor(opts: ModuleMapPluginOptions) {
    this.filename = opts.filename
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapPromise('ModuleMapPlugin', async compilation => {
      const moduleMap = compilation.chunks.reduce(
        (map, chunk) => {
          chunk.files.forEach((file: any) => {
            if (!file.endsWith('.js')) return

            for (const module of chunk.modulesIterable) {
              const currentModule =
                module instanceof ConcatenatedModule ? module.rootModule : module

              const request = currentModule.rawRequest

              if (!map[request]) {
                map[request] = []
              }

              map[request].push(file)
            }
          })

          return map
        },
        {} as {[path: string]: string}
      )

      const moduleMapJSON = JSON.stringify(moduleMap)

      fs.promises.mkdir(path.dirname(this.filename), {recursive: true})
      fs.promises.writeFile(this.filename, moduleMapJSON, 'utf-8')
    })
  }
}
