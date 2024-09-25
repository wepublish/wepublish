import chalk from 'chalk'
import * as util from 'node:util'

let fixedMessageText: string

export function setupLogger() {
  console.log = (...datas) =>
    datas.map(data =>
      writeWithFixedMessage(() => process.stdout.write(util.inspect(data, {depth: 4})))
    )

  console.error = (...datas) => {
    datas.map(data =>
      writeWithFixedMessage(() =>
        process.stdout.write(chalk.bgRed.black(util.inspect(data, {depth: 4})) + '\n')
      )
    )
  }
}

const moveUpLine = () => process.stdout.write('\x1b[1A')
const clearLine = (text: string) => process.stdout.write('\r' + ' '.repeat(text.length) + '\r')

const writeWithFixedMessage = (action: () => void) => {
  if (fixedMessageText) {
    const chunks = fixedMessageText.split(/\n/)
    chunks.map((text: string, i) => {
      clearLine(text)
      if (i < chunks.length - 1) {
        moveUpLine()
      }
    })
  }
  action()
  if (fixedMessageText) {
    process.stdout.write(fixedMessageText)
  }
}

export const fixedMessage = (text: string) => {
  writeWithFixedMessage(() => {
    fixedMessageText = text
  })
}
