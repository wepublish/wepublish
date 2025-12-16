import { Editor, Range, ReactRenderer } from '@tiptap/react';
import { SuggestionOptions } from '@tiptap/suggestion';
import { forwardRef } from 'react';

export const suggestions: Pick<SuggestionOptions, 'items' | 'render'> = {
  items: ({ query }) => {
    return [
      {
        title: 'Heading 1',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
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
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
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
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor.chain().focus().deleteRange(range).setMark('bold').run();
        },
      },
      {
        title: 'Italic',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor.chain().focus().deleteRange(range).setMark('italic').run();
        },
      },
    ]
      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10);
  },

  render: () => {
    let component: ReactRenderer<HTMLDivElement>;

    return {
      onStart: props => {
        component = new ReactRenderer(
          forwardRef<HTMLDivElement, any>((_, ref) => (
            <div ref={ref}>Lmao</div>
          )),
          {
            props,
            editor: props.editor,
          }
        );

        if (!props.clientRect) {
          return;
        }

        component.element.style.position = 'absolute';
        document.body.appendChild(component.element);
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          component.element.remove();

          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        component.destroy();
        component.element.remove();
      },
    };
  },
};
