import {
  RichtextElements,
  RichtextJSONDocument,
} from './json-format.interface';
import { normalizeListNesting } from './normalize-list-nesting';

const text = (value: string) =>
  ({ type: 'text', text: value }) as RichtextElements;

const paragraph = (value: string) =>
  ({ type: 'paragraph', content: [text(value)] }) as RichtextElements;

const listItem = (...content: RichtextElements[]) =>
  ({ type: 'listItem', content }) as RichtextElements;

const bulletList = (...content: RichtextElements[]) =>
  ({ type: 'bulletList', content }) as RichtextElements;

const orderedList = (...content: RichtextElements[]) =>
  ({
    type: 'orderedList',
    attrs: { start: 1 },
    content,
  }) as RichtextElements;

const doc = (...content: RichtextElements[]) =>
  ({ type: 'doc', content }) as RichtextJSONDocument;

describe('normalizeListNesting', () => {
  it('returns valid documents unchanged by reference', () => {
    const document = doc(
      paragraph('intro'),
      bulletList(
        listItem(paragraph('one')),
        listItem(paragraph('two'), bulletList(listItem(paragraph('nested'))))
      )
    );

    expect(normalizeListNesting(document)).toBe(document);
  });

  it('wraps a listItem nested directly inside a listItem in a bullet list', () => {
    const document = doc(
      bulletList(listItem(paragraph('parent'), listItem(paragraph('child'))))
    );

    expect(normalizeListNesting(document)).toEqual(
      doc(
        bulletList(
          listItem(
            paragraph('parent'),
            bulletList(listItem(paragraph('child')))
          )
        )
      )
    );
  });

  it('wraps orphaned listItems in an ordered list inside ordered lists', () => {
    const document = doc(
      orderedList(listItem(paragraph('parent'), listItem(paragraph('child'))))
    );

    expect(normalizeListNesting(document)).toEqual(
      doc(
        orderedList(
          listItem(
            paragraph('parent'),
            orderedList(listItem(paragraph('child')))
          )
        )
      )
    );
  });

  it('merges consecutive orphaned listItems into a single list', () => {
    const document = doc(
      bulletList(
        listItem(
          paragraph('parent'),
          listItem(paragraph('one')),
          listItem(paragraph('two')),
          paragraph('outro'),
          listItem(paragraph('three'))
        )
      )
    );

    expect(normalizeListNesting(document)).toEqual(
      doc(
        bulletList(
          listItem(
            paragraph('parent'),
            bulletList(listItem(paragraph('one')), listItem(paragraph('two'))),
            paragraph('outro'),
            bulletList(listItem(paragraph('three')))
          )
        )
      )
    );
  });

  it('normalizes deeply nested orphaned listItems', () => {
    const document = doc(
      bulletList(
        listItem(
          paragraph('level 1'),
          listItem(paragraph('level 2'), listItem(paragraph('level 3')))
        )
      )
    );

    expect(normalizeListNesting(document)).toEqual(
      doc(
        bulletList(
          listItem(
            paragraph('level 1'),
            bulletList(
              listItem(
                paragraph('level 2'),
                bulletList(listItem(paragraph('level 3')))
              )
            )
          )
        )
      )
    );
  });
});
