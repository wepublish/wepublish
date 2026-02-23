import { faker } from '@faker-js/faker';
import { Descendant } from 'slate';

export const mockRichText = () =>
  [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, ',
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true,
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true,
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true,
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true,
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ',
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, ',
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true,
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true,
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true,
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true,
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ',
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, ',
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true,
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true,
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true,
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true,
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ',
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, ',
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true,
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true,
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true,
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true,
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ',
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        },
      ],
    },
  ] as Descendant[];

export const mockShortRichText = () =>
  [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Dies ist eine kurze Beschreibung des Inhalts.',
        },
      ],
    },
  ] as Descendant[];
