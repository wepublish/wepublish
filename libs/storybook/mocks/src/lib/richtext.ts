import { faker } from '@faker-js/faker';
import { RichtextJSONDocument } from '@wepublish/richtext';

export const mockRichText = () =>
  ({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          textAlign: null,
          level: 3,
        },
        content: [
          {
            type: 'text',
            text: faker.lorem.words({
              min: 3,
              max: 8,
            }),
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: {
          textAlign: null,
        },
        content: [
          {
            type: 'text',
            text: 'Lorem ipsum dolor sit amet consectetur ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'textStyle',
                attrs: {
                  backgroundColor: null,
                  color: '#ff0000',
                  fontFamily: null,
                  fontSize: null,
                  lineHeight: null,
                },
              },
            ],
            text: 'adipiscing',
          },
          {
            type: 'text',
            text: ' elit. ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'textStyle',
                attrs: {
                  backgroundColor: '#cfcfcf',
                  color: null,
                  fontFamily: null,
                  fontSize: null,
                  lineHeight: null,
                },
              },
            ],
            text: 'Quisque',
          },
          {
            type: 'text',
            text: ' faucibus ex sapien vitae pellentesque sem placerat. In ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'bold',
              },
            ],
            text: 'id cursus',
          },
          {
            type: 'text',
            text: ' mi pretium tellus duis ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'italic',
              },
            ],
            text: 'convallis',
          },
          {
            type: 'text',
            text: '. ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'strike',
              },
            ],
            text: 'Tempus',
          },
          {
            type: 'text',
            text: ' leo eu aenean sed diam urna tempor. ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'underline',
              },
            ],
            text: 'Pulvinar',
          },
          {
            type: 'text',
            text: ' vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'superscript',
              },
            ],
            text: 'torquent',
          },
          {
            type: 'text',
            text: ' per conubia nostra ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'subscript',
              },
            ],
            text: 'inceptos',
          },
          {
            type: 'text',
            text: ' himenaeos.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          textAlign: null,
          level: 4,
        },
        content: [
          {
            type: 'text',
            text: faker.lorem.words({
              min: 3,
              max: 8,
            }),
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: {
          textAlign: null,
        },
        content: [
          {
            type: 'text',
            text: faker.lorem.paragraphs({
              min: 3,
              max: 6,
            }),
          },
          {
            type: 'text',
            text: ' ',
          },
          {
            type: 'text',
            text: faker.lorem.words({
              min: 3,
              max: 6,
            }),
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com',
                  target: '_blank',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'Lorem',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tableHeader',
                attrs: {
                  colspan: 1,
                  rowspan: 2,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'Ipsum',
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'amet',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tableHeader',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'dolor',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'sit',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tableCell',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'consectetur',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                attrs: {
                  colspan: 1,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'adipiscing',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tableCell',
                attrs: {
                  colspan: 2,
                  rowspan: 1,
                  colwidth: null,
                  borderColor: null,
                },
                content: [
                  {
                    type: 'paragraph',
                    attrs: {
                      textAlign: null,
                    },
                    content: [
                      {
                        type: 'text',
                        text: 'elit',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: {
          textAlign: null,
          level: 5,
        },
        content: [
          {
            type: 'text',
            text: faker.lorem.words({
              min: 3,
              max: 8,
            }),
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: {
          language: null,
        },
        content: [
          {
            type: 'text',
            text: `class HelloWorldApp {
  public static void main(String[] args) {
    System.out.println("Hello World!");
  }
}`,
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: {
          textAlign: null,
        },
      },
    ],
  }) as RichtextJSONDocument;

export const mockShortRichText = () =>
  [
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.sentence(),
        },
      ],
    },
  ] as RichtextJSONDocument;
