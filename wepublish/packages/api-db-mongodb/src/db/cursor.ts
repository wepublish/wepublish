import {base64Decode, base64Encode} from '../utility'

export class Cursor {
  static Delimiter = '|'

  readonly id: string
  readonly date?: Date

  constructor(id: string, date?: Date) {
    this.id = id
    this.date = date
  }

  toString() {
    const components = []

    components.push(this.id)
    if (this.date) components.push(this.date.getTime())

    return base64Encode(components.join(Cursor.Delimiter))
  }

  static from(encodedStr: string) {
    const str = base64Decode(encodedStr)
    const [id, dateStr] = str.split(Cursor.Delimiter)

    return new Cursor(id, dateStr ? new Date(parseInt(dateStr)) : undefined)
  }
}
