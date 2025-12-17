import { Editor, posToDOMRect, ReactRenderer } from '@tiptap/react';
import {
  FloatingElement,
  computePosition,
  shift,
  flip,
} from '@floating-ui/dom';
import { CommandList } from './command-list';
import { CommandItem, CommandOptions } from '../commands';
import { SuggestionKeyDownProps } from '@tiptap/suggestion';

const updatePosition = (editor: Editor, element: FloatingElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  };

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content';
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

export const commandSuggestions = {
  items: ({ query }) =>
    (
      [
        {
          title: 'Heading 1',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode('heading', { level: 1 })
              .run();
          },
        },
        {
          title: 'Heading 2',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode('heading', { level: 2 })
              .run();
          },
        },
        {
          title: 'Bold',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setMark('bold').run();
          },
        },
        {
          title: 'Italic',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setMark('italic').run();
          },
        },
      ] as CommandItem[]
    )
      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10),

  render: () => {
    let component: ReactRenderer<{
      onKeyDown?: (props: SuggestionKeyDownProps) => any;
    }>;

    return {
      onStart: props => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        component.element.style.position = 'absolute';
        document.body.appendChild(component.element);

        updatePosition(props.editor, component.element);
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        updatePosition(props.editor, component.element);
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          component.element.remove();

          return true;
        }

        return component.ref?.onKeyDown?.(props);
      },

      onExit() {
        component.destroy();
        component.element.remove();
      },
    };
  },
} satisfies Pick<CommandOptions, 'items' | 'render'>;

export type CommandSuggestion = typeof commandSuggestions;
