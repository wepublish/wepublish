import {promises as fs, existsSync} from 'fs'
import * as path from 'path'

let logsDirectory: string

export const logError = async (id: string | number, content: string | any) => {
  if (process.env['DEBUG'] === '1') {
    console.error(content)
  }
  if (!logsDirectory) {
    const mainLogsDirectory = 'libs/migrate-wordpress/logs'
    const latest = path.join(mainLogsDirectory, 'latest')
    const date = new Date().toISOString()
    logsDirectory = path.join(mainLogsDirectory, date)
    await fs.mkdir(logsDirectory)
    if (existsSync(latest)) {
      await fs.unlink(latest)
    }
    await fs.symlink(date, latest)
  }
  const idLogDirectory = path.join(logsDirectory, `${id}`)
  await fs.writeFile(idLogDirectory, content + '\n', {flag: 'a'})
  return idLogDirectory
}
