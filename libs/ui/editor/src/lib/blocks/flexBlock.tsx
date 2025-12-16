import { BlockProps } from '../atoms';
import { FlexBlockValue } from './types';

export const FlexBlock = ({
  value,
  onChange,
  autofocus,
}: BlockProps<FlexBlockValue>) => {
  console.log('Rendering FlexBlock with value:', value);

  const setTheValue = (newValue: FlexBlockValue): string | undefined => {
    //console.log('Setting new value for FlexBlock:', newValue);
    // sidebar content block style
    // create a block-style called "TabbedContentSidebar"
    // below set the id of that block-style
    // before each save/publish click once in every FlexBlock textarea to ensure the correct data is ready....
    if (
      newValue &&
      newValue.blockStyle === 'beb77a99-0344-47c6-8bd8-e24b93bb7e4e'
    ) {
      return JSON.stringify(
        {
          type: 'flexBlock',
          nestedBlocks: [
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['5bf64c06-bb04-4d3a-a0cd-dc0db102c28d'],
                    },
                    teaserType: 'Article',
                  },
                  title: null,
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: {
                        custom: {
                          contentUrl: null,
                          openInNewTab: false,
                          title: null,
                          preTitle: 'daily briefing',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/newsletter-anmelden-link-to-be-defined',
                          openInNewTab: false,
                          title: 'Das Wichtigste aus Zürich',
                          lead: 'Lorem ipsum dolor sit amet, consectetur adipiscing elited do eiusmod Lorem ipsum dolor sit amet, consectetur adipiscing elited do eiusmod Lorem ipsum dolor sit.',
                          properties: [],
                          preTitle: 'Kostenlos abonnieren!',
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: false,
                    filter: null,
                    teaserType: 'Article',
                  },
                  title: 'Briefing',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl:
                            '/event?from=2025-11-30T23%3A00%3A00.000Z&to=2026-12-31T22%3A59%3A00.000Z',
                          openInNewTab: false,
                          preTitle: 'Mehr Events',
                          title: 'Unsere Event-Liste',
                          lead: 'Wir bieten dir regelmässig spannende Anlässe und Events.',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: null,
                    teaserType: 'Event',
                  },
                  title: 'Fokusmonat',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: {
                        custom: {
                          contentUrl:
                            'https://shop.tsri.ch/products/tsuri-lette-1',
                          openInNewTab: true,
                          title: 'Tsüri Lette',
                          lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                          imageID: '5e653fb0-c76d-4496-99a6-5ddeb8112a8f',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl:
                            'https://shop.tsri.ch/products/tsuri-lette-1',
                          openInNewTab: true,
                          title: 'Tsüri Lette',
                          lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                          imageID: '5e653fb0-c76d-4496-99a6-5ddeb8112a8f',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl:
                            'https://shop.tsri.ch/products/tsuri-lette-1',
                          openInNewTab: true,
                          title: 'Tsüri Lette',
                          lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                          imageID: '5e653fb0-c76d-4496-99a6-5ddeb8112a8f',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: 'https://shop.tsri.ch/',
                          openInNewTab: false,
                          preTitle: 'Zum Shop',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: false,
                    filter: null,
                    teaserType: 'Custom',
                  },
                  title: 'Shop',
                },
              },
            },
          ],
        },
        null,
        2
      );
    }
    // create a block-style called "TabbedContentMain"
    // below set the id of that block-style
    else if (
      newValue &&
      newValue.blockStyle === 'ec6b5203-ffd4-4903-aa00-c526c45de464'
    ) {
      // main content block style
      return JSON.stringify(
        {
          type: 'flexBlock',
          nestedBlocks: [
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/wohnen',
                          openInNewTab: false,
                          title: 'Mehr zum Thema Wohnen',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['5bf64c06-bb04-4d3a-a0cd-dc0db102c28d'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Wohnen',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/politik',
                          openInNewTab: false,
                          title: 'Mehr zum Thema Politik',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['clxkczkq60096pv07gkxvrmqf'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Politik',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/stadtleben',
                          openInNewTab: false,
                          title: 'Mehr zum Thema Stadtleben',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['323c058f-d56d-489e-9084-f3fd37feb0a2'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Stadtleben',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/mobilität',
                          openInNewTab: false,
                          title: 'Mehr zum Thema Mobilität',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['70a5bc62-628b-4b23-8cb6-05c9b64542f5'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Mobilität',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/kultur',
                          openInNewTab: false,
                          title: 'Mehr zum Thema Kultur',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['831ef2f7-0106-4417-bc7f-64aae44f58fd'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Kultur',
                },
              },
            },
            {
              alignment: {
                i: '',
                x: 0,
                y: 0,
                w: 0,
                h: 0,
                static: false,
              },
              block: {
                teaserSlots: {
                  slots: [
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: null,
                      type: 'Autofill',
                    },
                    {
                      teaser: {
                        custom: {
                          contentUrl: '/a/tag/kolumnen',
                          openInNewTab: false,
                          title: 'Mehr Kolumnen',
                          properties: [],
                        },
                      },
                      type: 'Manual',
                    },
                  ],
                  autofillConfig: {
                    enabled: true,
                    filter: {
                      tags: ['f82e18dc-bc0b-4ad6-9fd6-b7496d43286a'],
                    },
                    teaserType: 'Article',
                  },
                  title: 'Kolumnen',
                },
              },
            },
          ],
        },
        null,
        2
      );
    }
    return JSON.stringify(newValue, null, 2);
  };

  return (
    <div>
      <h2>{'Der FlexBlock kommt hier hin.'}</h2>
      <textarea
        autoFocus={autofocus}
        //defaultValue={JSON.stringify(value, null, 2)}
        defaultValue={setTheValue(value)}
        //value={setTheValue(value)}
        onChange={e => {
          e.stopPropagation();
          e.preventDefault();
          console.log('Textarea change:');
          return void 0;
        }}
        onBlur={e => {
          console.log('onblur');
          try {
            const parsedValue = JSON.parse(e.target.value);
            onChange(parsedValue);
          } catch (error) {
            console.error('Invalid JSON:', error);
          }
        }}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};
