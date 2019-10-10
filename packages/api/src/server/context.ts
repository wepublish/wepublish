import {IncomingMessage} from 'http'
import {Adapter} from './adapter'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  user: any
}

export interface ContextOptions {
  adapter: Adapter
}

export function contextFromRequest(req: IncomingMessage, {adapter}: ContextOptions): Context {
  return {
    adapter,
    user: {}
  }
}
