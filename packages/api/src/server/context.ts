import {IncomingMessage} from 'http'
import {Adapter} from './adapter'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  user: any
}

export function contextFromRequest({adapter}: ContextRequest): Context {
  return {
    adapter,
    user: {}
  }
}
