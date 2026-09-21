import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  BlockStylesDocument,
  EditorBlockType,
  FullBlockTemplateFragment,
} from '@wepublish/editor/api';
import { useState } from 'react';

import { BlockList, BlockProps } from '../atoms/blockList';
import { BlockMap } from './blockMap';
import { BlockTemplateBlock } from './blockTemplateBlock';
import { BlockTemplateBlockValue, BlockValue } from './types';

const useBlockTemplateListQuery = vi.fn();

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...((await importOriginal()) as object),
  useBlockTemplateListQuery: (...args: unknown[]) =>
    useBlockTemplateListQuery(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const titleBlock = (title: string) => ({
  __typename: 'TitleBlock',
  type: 'title',
  blockStyle: null,
  disabled: false,
  preTitle: `${title} Pre-Title`,
  title,
  lead: `${title} Lead`,
});

const template = (
  id: string,
  name: string,
  blocks: ReturnType<typeof titleBlock>[]
) => ({ id, name, blocks }) as unknown as FullBlockTemplateFragment;

const defaultTemplate = template('template-1', 'Header Template', [
  titleBlock('First Title'),
  titleBlock('Second Title'),
]);

const blockStylesMock = [
  {
    request: { query: BlockStylesDocument, variables: {} },
    result: { data: { blockStyles: [] } },
  },
];

const mockQuery = ({
  templates = [defaultTemplate],
  loading = false,
}: { templates?: FullBlockTemplateFragment[]; loading?: boolean } = {}) => {
  const refetch = vi.fn();

  useBlockTemplateListQuery.mockReturnValue({
    data: { blockTemplates: { nodes: templates } },
    loading,
    refetch,
  });

  return { refetch };
};

const renderBlock = ({
  value = { template: defaultTemplate },
  ...props
}: Partial<BlockProps<BlockTemplateBlockValue>> = {}) => {
  const onChange = vi.fn();
  const onReplace = vi.fn();

  const result = render(
    <BlockTemplateBlock
      value={value}
      onChange={onChange}
      onReplace={onReplace}
      {...props}
    />
  );

  return { ...result, onChange, onReplace };
};

const BlockListHarness = ({ initialValue }: { initialValue: BlockValue[] }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <MockedProvider mocks={blockStylesMock}>
      <BlockList
        value={value}
        onChange={setValue}
        blockMap={BlockMap}
      />
    </MockedProvider>
  );
};

const templateBlockValue = (key = 'template-block'): BlockValue => ({
  key,
  type: EditorBlockType.BlockTemplate,
  value: { template: defaultTemplate },
});

const titleBlockValue = (key: string, title: string): BlockValue => ({
  key,
  type: EditorBlockType.Title,
  value: { title, preTitle: '', lead: '' },
});

const useContentButton = () =>
  screen.getByRole('button', { name: 'blocks.blockTemplate.useContent' });

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery();
});

describe('BlockTemplateBlock', () => {
  describe('read-only preview', () => {
    it('should preview every block of the selected template', () => {
      renderBlock();

      expect(screen.getByDisplayValue('First Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Second Title')).toBeInTheDocument();
      expect(screen.getAllByText('blocks.title.label')).toHaveLength(2);
    });

    it('should render the previewed blocks read-only as long as the content is not used', () => {
      const { container } = renderBlock();

      const inputs = container.querySelectorAll('textarea, input[type="text"]');

      expect(inputs.length).toBeGreaterThan(0);
      inputs.forEach(input => expect(input).toBeDisabled());
    });

    it('should not preview anything when no template is selected', () => {
      renderBlock({ value: { template: null } });

      expect(screen.queryByDisplayValue('First Title')).not.toBeInTheDocument();
      expect(useContentButton()).toBeDisabled();
    });

    it('should preview the up-to-date template when it has been modified elsewhere', () => {
      mockQuery({
        templates: [
          template('template-1', 'Header Template', [
            titleBlock('Edited Title'),
          ]),
        ],
      });

      renderBlock({
        value: {
          template: template('template-1', 'Header Template', [
            titleBlock('Stale Title'),
          ]),
        },
      });

      expect(screen.getByDisplayValue('Edited Title')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Stale Title')).not.toBeInTheDocument();
    });

    it('should fall back to the stored template while the list is still loading', () => {
      mockQuery({ templates: [], loading: true });

      renderBlock();

      expect(screen.getByDisplayValue('First Title')).toBeInTheDocument();
    });
  });

  describe('using the content', () => {
    it('should hand the converted blocks to onReplace', () => {
      const { onReplace } = renderBlock();

      fireEvent.click(useContentButton());

      expect(onReplace).toHaveBeenCalledTimes(1);

      const [blocks] = onReplace.mock.calls[0] as [BlockValue[]];

      expect(blocks).toHaveLength(2);
      expect(blocks.map(({ type }) => type)).toEqual([
        EditorBlockType.Title,
        EditorBlockType.Title,
      ]);
      expect(blocks[0].value).toMatchObject({ title: 'First Title' });
      expect(blocks[1].value).toMatchObject({ title: 'Second Title' });
    });

    it('should give every replaced block its own key', () => {
      const { onReplace } = renderBlock();

      fireEvent.click(useContentButton());

      const [blocks] = onReplace.mock.calls[0] as [BlockValue[]];
      const keys = blocks.map(({ key }) => key);

      expect(keys.every(Boolean)).toBe(true);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should not be usable when the template has no blocks', () => {
      const emptyTemplate = template('template-1', 'Empty', []);

      mockQuery({ templates: [emptyTemplate] });
      renderBlock({ value: { template: emptyTemplate } });

      expect(useContentButton()).toBeDisabled();
    });

    it('should not be usable when the block is disabled', () => {
      renderBlock({ disabled: true });

      expect(useContentButton()).toBeDisabled();
    });

    it('should not be usable when the block list does not support replacing', () => {
      renderBlock({ onReplace: undefined });

      expect(useContentButton()).toBeDisabled();
    });
  });

  describe('inside a block list', () => {
    it('should disappear and leave its content behind once it is used', () => {
      render(<BlockListHarness initialValue={[templateBlockValue()]} />);

      expect(useContentButton()).toBeEnabled();
      expect(screen.getByDisplayValue('First Title')).toBeDisabled();

      fireEvent.click(useContentButton());

      expect(
        screen.queryByRole('button', {
          name: 'blocks.blockTemplate.useContent',
        })
      ).not.toBeInTheDocument();

      expect(screen.getByDisplayValue('First Title')).toBeEnabled();
      expect(screen.getByDisplayValue('Second Title')).toBeEnabled();
    });

    it('should keep the surrounding blocks untouched', () => {
      render(
        <BlockListHarness
          initialValue={[
            titleBlockValue('before', 'Before'),
            templateBlockValue(),
            titleBlockValue('after', 'After'),
          ]}
        />
      );

      fireEvent.click(useContentButton());

      const titles = screen
        .getAllByDisplayValue(/^(Before|First Title|Second Title|After)$/)
        .map(input => (input as HTMLTextAreaElement).value);

      expect(titles).toEqual([
        'Before',
        'First Title',
        'Second Title',
        'After',
      ]);
    });
  });
});
