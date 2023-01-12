import { GraphQLScalarType } from 'graphql';
export declare enum ElementNodeType {
    H1 = "heading-one",
    H2 = "heading-two",
    H3 = "heading-three",
    Paragraph = "paragraph",
    UnorderedList = "unordered-list",
    OrderedList = "ordered-list",
    ListItem = "list-item",
    Link = "link",
    Table = "table",
    TableRow = "table-row",
    TableCell = "table-cell"
}
export declare enum TextNodeFields {
    Text = "text",
    Bold = "bold",
    Italic = "italic",
    Underline = "underline",
    Strikethrough = "strikethrough",
    Superscript = "superscript",
    Subscript = "subscript"
}
export declare enum ElementNodeFields {
    Type = "type",
    Children = "children"
}
export declare enum LinkNodeFields {
    URL = "url",
    Title = "title"
}
export declare enum TableCellNodeFields {
    Bordercolor = "borderColor"
}
export interface RichTextBlockNode {
    readonly type: ElementNodeType.H1 | ElementNodeType.H2 | ElementNodeType.H3 | ElementNodeType.Paragraph | ElementNodeType.UnorderedList | ElementNodeType.OrderedList | ElementNodeType.ListItem | ElementNodeType.Table | ElementNodeType.TableRow;
    readonly children: RichTextNode[];
}
export interface RichTextTableCellNode {
    readonly type: ElementNodeType.TableCell;
    readonly borderColor: string;
    readonly children: RichTextNode[];
}
export interface RichTextLinkNode {
    readonly type: ElementNodeType.Link;
    readonly url: string;
    readonly title?: string;
    readonly children: RichTextNode[];
}
export interface RichTextTextNode {
    readonly bold?: boolean;
    readonly italic?: boolean;
    readonly underline?: boolean;
    readonly strikethrough?: boolean;
    readonly superscript?: boolean;
    readonly subscript?: boolean;
    readonly text: string;
}
export declare type RichTextNode = RichTextBlockNode | RichTextTableCellNode | RichTextLinkNode | RichTextTextNode;
export declare const GraphQLRichText: GraphQLScalarType;
export declare function createRichTextError(message: string, path: string[]): Error;
export declare function parseRichTextNode(value: unknown, path?: string[]): RichTextNode;
export declare function parseRichTextNodes(value: unknown, path?: string[]): RichTextNode[];
//# sourceMappingURL=richText.d.ts.map