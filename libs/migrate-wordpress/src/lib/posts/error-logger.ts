import {promises as fs} from 'fs'
import * as path from 'path'

let logsDirectory: string

export const logError = async (id: string | number, content: string | any) => {
  if (!logsDirectory) {
    const mainLogsDirectory = 'libs/migrate-wordpress/logs'
    const latest = path.join(mainLogsDirectory, 'latest')
    const date = new Date().toISOString()
    logsDirectory = path.join(mainLogsDirectory, date)
    await fs.mkdir(logsDirectory)
    if (await fs.stat(latest)) {
      await fs.unlink(latest)
    }
    await fs.symlink(date, latest)
  }
  await fs.writeFile(path.join(logsDirectory, `${id}`), content + '\n', {flag: 'a'})
}
