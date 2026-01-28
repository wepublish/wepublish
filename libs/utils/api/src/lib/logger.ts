import pino from 'pino';

type ServerLoggerProps = { logger?: pino.Logger };

const _serverLogger: ServerLoggerProps = {};

export const serverLogger: Readonly<typeof _serverLogger> = _serverLogger;

export const setLogger = (logger?: pino.Logger) => {
  _serverLogger.logger = logger;
};

export function logger(moduleName: string): pino.Logger {
  if (!serverLogger.logger) {
    setLogger(pino({ name: 'we.publish' }));
  }

  return serverLogger.logger!.child({ module: moduleName });
}
