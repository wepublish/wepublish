import chalk from 'chalk';
import * as util from 'node:util';

let fixedMessageText: string;

export function setupLogger() {
  if (!process.env['DEBUG']) {
    console.debug = data => undefined;
  }

  const inspect = (data: any) => {
    if (typeof data === 'object') {
      return util.inspect(data, { depth: 5 });
    }
    return data;
  };

  console.log = (...datas) =>
    datas.map(data =>
      writeWithFixedMessage(() => process.stdout.write(inspect(data) + '\n'))
    );

  console.error = (...datas) => {
    datas.map(data =>
      writeWithFixedMessage(() =>
        process.stdout.write(chalk.bgRed.black(inspect(data)) + '\n')
      )
    );
  };
}

const moveUpLine = () => process.stdout.write('\x1b[1A');
const clearLine = (text: string) =>
  process.stdout.write('\r' + ' '.repeat(text.length) + '\r');

const writeWithFixedMessage = (action: () => void) => {
  if (fixedMessageText) {
    const chunks = fixedMessageText.split(/\n/);
    chunks.map((text: string, i) => {
      clearLine(text);
      if (i < chunks.length - 1) {
        moveUpLine();
      }
    });
  }
  action();
  if (fixedMessageText) {
    process.stdout.write(fixedMessageText);
  }
};

export const fixedMessage = (text: string) => {
  writeWithFixedMessage(() => {
    fixedMessageText = text;
  });
};
