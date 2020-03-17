import {Context} from './context'

declare global {
  namespace Express {
    export interface Request {
      wpContext: Context
    }
  }
}
