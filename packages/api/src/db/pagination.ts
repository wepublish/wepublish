import {UserInputError} from 'apollo-server'

export enum InputCursorType {
  After = 'after',
  Before = 'before',
  None = 'none'
}

export type InputCursor =
  | {
      readonly type: InputCursorType.Before | InputCursorType.After
      readonly data: string
    }
  | {
      readonly type: InputCursorType.None
    }

export function InputCursor(after?: string, before?: string): InputCursor {
  if (after != null && before != null) {
    throw new UserInputError('You must provide either `after` or `before`.')
  }

  if (!after && !before) {
    return {type: InputCursorType.None}
  }

  return {
    type: after ? InputCursorType.After : InputCursorType.Before,
    data: after || before!
  }
}

export enum LimitType {
  First = 'first',
  Last = 'last'
}

export interface Limit {
  readonly type: LimitType
  readonly count: number
}

export function Limit(first?: number, last?: number): Limit {
  if ((first == null && last == null) || (first != null && last != null)) {
    throw new UserInputError('You must provide either `first` or `last`.')
  }

  return {
    type: first ? LimitType.First : LimitType.Last,
    count: first || last!
  }
}
