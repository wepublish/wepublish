import { BlockContent, BlockContentInput } from '@wepublish/editor/api-v2';
import { PuckData } from './editor.config';
import nanoid from 'nanoid';
import { pick } from 'ramda';

export const puckToBlockContentInput = (
  data: PuckData
): BlockContentInput[] => {
  const result = data.content.flatMap((component): BlockContentInput | [] => {
    switch (component.type) {
      case 'Title': {
        return {
          title: pick(['title', 'lead', 'preTitle'] as const, component.props),
        };
      }
      case 'Quote': {
        return {
          quote: pick(['quote', 'author'] as const, component.props),
        };
      }
      case 'RichText':
        return {
          richText: pick(['richText'] as const, component.props),
        };
      case 'Break':
        return {
          linkPageBreak: pick(
            ['text', 'richText', 'hideButton', 'linkText', 'linkURL'] as const,
            component.props
          ),
        };

      case 'IFrame':
        return {
          embed: pick(['url', 'title'] as const, component.props),
        };
      case 'Facebook':
        return {
          facebookPost: pick(['postID', 'userID'] as const, component.props),
        };
      case 'FacebookVideo':
        return {
          facebookVideo: pick(['videoID', 'userID'] as const, component.props),
        };
      case 'TikTok':
        return {
          tikTokVideo: pick(['videoID', 'userID'] as const, component.props),
        };
      case 'Vimeo':
        return {
          vimeoVideo: pick(['videoID'] as const, component.props),
        };
      case 'YouTube':
        return {
          youTubeVideo: pick(['videoID'] as const, component.props),
        };

      case 'Html':
        return {
          html: pick(['html'] as const, component.props),
        };

      case 'Subscribe':
        return {
          subscribe: {
            fields: component.props.fields.flatMap(field =>
              field.field ? field.field : []
            ),
            memberPlanIds: component.props.memberPlans.flatMap(field =>
              field.memberPlan ? field.memberPlan.id : []
            ),
          },
        };

      case 'Teaser': {
        return {
          teaserGrid: {
            numColumns: 1,
            teasers: [
              // @TODO:
              null,
            ],
          },
        };
      }
    }

    return [];
  });

  return result;
};

export const blockContentToPuck = (
  data: BlockContent[]
): PuckData['content'] => {
  return data.flatMap(content => {
    switch (content.__typename) {
      case 'TitleBlock': {
        return {
          type: 'Title',
          props: {
            id: nanoid(),
            ...content,
          },
        };
      }

      case 'HTMLBlock':
        return {
          type: 'Html',
          props: {
            id: nanoid(),
            ...content,
          },
        };

      case 'RichTextBlock':
        return {
          type: 'RichText',
          props: {
            id: nanoid(),
            ...content,
          },
        };
    }

    return [];
  });
};
