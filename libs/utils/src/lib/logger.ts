import pino from 'pino'

type ServerLoggerProps = {logger?: pino.Logger}
export const serverLogger: ServerLoggerProps = {}

export function logger(moduleName: string): pino.Logger {
  return (serverLogger.logger || pino({name: 'we.publish'})).child({module: moduleName})
}
