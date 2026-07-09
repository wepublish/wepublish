import { compose } from 'ramda';
import { RichtextElements, Text } from './json-format.interface';

export const truncateParagraph =
  (maxLength: number) =>
  (paragraph: RichtextElements | undefined): RichtextElements | undefined => {
    let textLength = 0;

    if (paragraph?.type !== 'paragraph') {
      return;
    }

    const truncated = paragraph.content?.reduce(
      (acc, curr) => {
        if (curr.type !== 'text') {
          return acc;
        }

        let newText = curr.text;

        if (textLength + curr.text.length > maxLength) {
          newText = curr.text.substring(0, Math.max(0, maxLength - textLength));
        }

        acc.content.push({
          ...curr,
          text: newText,
        });
        textLength += newText.length;

        return acc;
      },
      { ...paragraph, content: [] as Text[] }
    );

    return truncated;
  };

export const findFirstParagraph = (
  nodes: RichtextElements[]
): RichtextElements | undefined =>
  nodes.find(node => node.type === 'paragraph');

export const truncateFirstParagraph = (maxLength: number) =>
  compose(truncateParagraph(maxLength), findFirstParagraph);
