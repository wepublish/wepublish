import { BlockFormat } from '@wepublish/richtext';
import { Editor, Element, Node, Path, Transforms } from 'slate';

import { DEFAULT_BORDER_COLOR, emptyTextParagraph } from './elements';

export function withNormalizeNode<T extends Editor>(editor: T): T {
  const { normalizeNode } = editor;

  editor.normalizeNode = entry => {
    const [node, path] = entry;

    if (!Element.isElement(node)) {
      return normalizeNode(entry);
    }

    switch (node.type) {
      case BlockFormat.TableCell:
        if (ensureParentType(BlockFormat.TableRow)) return;
        if (ensureHasBorderColor()) return;
        // TODO if child is text node wrap into paragraph. Text directly in tablecell behaves wrongly
        break;

      case BlockFormat.TableRow:
        // Order of corrections is important!
        // Explanation (missing):
        // Seems to have an effect when requiring constraints on parent and children.
        // Actually, (IMO) it should not have an effect, as every new or modified node gets checked from it's lowest node upwards
        // (see https://docs.slatejs.org/concepts/10-normalizing#multi-pass-normalizing).
        // TODO find reason or report to slate?
        if (
          ensureChildType(BlockFormat.TableCell, {
            borderColor: DEFAULT_BORDER_COLOR,
          })
        )
          return;
        if (ensureParentType(BlockFormat.Table)) return;
        // TODO? mergeAdjacentRows()
        break;

      case BlockFormat.Table:
        if (ensureChildType(BlockFormat.TableRow)) return;
        if (mergeAdjacent()) return; // needed when copy pasting tables
        if (ensureSubseedingParagraph()) return;
        break;
    }
    // TODO ensure ol / li structure (see at bottom)

    function ensureHasBorderColor() {
      if (Element.isElement(node) && !node.borderColor) {
        Transforms.setNodes(
          editor,
          { borderColor: DEFAULT_BORDER_COLOR },
          { at: path }
        );
        return true;
      }

      return false;
    }

    function ensureChildType(
      type: BlockFormat,
      extraWrapperAttrs: { [key: string]: any } = {}
    ) {
      if (Element.isElement(node)) {
        for (const [child, childPath] of Node.children(editor, path)) {
          if (!Element.isElement(child) || child.type !== type) {
            wrapAllChildren(type, [child, childPath], extraWrapperAttrs);
            return true;
          }
        }
      }

      return false;
    }

    function ensureParentType(
      type: BlockFormat,
      extraWrapperAttrs: { [key: string]: any } = {}
    ) {
      const parent = Node.parent(editor, path);

      if (!Element.isElement(parent) || parent.type !== type) {
        wrapAllChildren(type, [node, path], extraWrapperAttrs);
        return true;
      }

      return false;
    }

    function wrapAllChildren(
      type: BlockFormat,
      [node, path]: typeof entry,
      extraWrapperAttrs?: { [key: string]: any }
    ) {
      if (Element.isElement(node)) {
        Transforms.wrapNodes(
          editor,
          { type, children: node.children as Element[], ...extraWrapperAttrs }, // TODO simply =node  ?
          {
            at: path,
            mode: 'all',
          }
        );
      }
    }

    function mergeAdjacent() {
      const pathOfPreceding: Path = [path[0] + 1];
      const precedingNode =
        Node.has(editor, pathOfPreceding) ?
          Node.get(editor, pathOfPreceding)
        : null;

      if (
        Element.isElement(precedingNode) &&
        Element.isElement(node) &&
        precedingNode.type === node.type
      ) {
        Transforms.mergeNodes(editor, { at: pathOfPreceding });
        return true;
      }

      return false;
    }

    function ensureSubseedingParagraph() {
      // Ensure Table is followed by paragraph at bottom for flawless continuation
      const pathOfSubsequent: Path = [path[0] + 1];
      const subsequentNode =
        Node.has(editor, pathOfSubsequent) ?
          Node.get(editor, pathOfSubsequent)
        : null;

      if (
        !Element.isElement(subsequentNode) ||
        subsequentNode.type !== BlockFormat.Paragraph
      ) {
        Transforms.insertNodes(editor, emptyTextParagraph(), {
          at: pathOfSubsequent,
        });
        return true;
      }

      return false;
    }

    // Fall back to the original `normalizeNode` to enforce builtin constraints.
    normalizeNode(entry);
  };

  return editor;
}
