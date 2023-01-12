"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRichTextNodes = exports.parseRichTextNode = exports.createRichTextError = exports.GraphQLRichText = exports.TableCellNodeFields = exports.LinkNodeFields = exports.ElementNodeFields = exports.TextNodeFields = exports.ElementNodeType = void 0;
const graphql_1 = require("graphql");
const utility_1 = require("../utility");
var ElementNodeType;
(function (ElementNodeType) {
    ElementNodeType["H1"] = "heading-one";
    ElementNodeType["H2"] = "heading-two";
    ElementNodeType["H3"] = "heading-three";
    ElementNodeType["Paragraph"] = "paragraph";
    ElementNodeType["UnorderedList"] = "unordered-list";
    ElementNodeType["OrderedList"] = "ordered-list";
    ElementNodeType["ListItem"] = "list-item";
    ElementNodeType["Link"] = "link";
    ElementNodeType["Table"] = "table";
    ElementNodeType["TableRow"] = "table-row";
    ElementNodeType["TableCell"] = "table-cell";
})(ElementNodeType = exports.ElementNodeType || (exports.ElementNodeType = {}));
var TextNodeFields;
(function (TextNodeFields) {
    TextNodeFields["Text"] = "text";
    TextNodeFields["Bold"] = "bold";
    TextNodeFields["Italic"] = "italic";
    TextNodeFields["Underline"] = "underline";
    TextNodeFields["Strikethrough"] = "strikethrough";
    TextNodeFields["Superscript"] = "superscript";
    TextNodeFields["Subscript"] = "subscript";
})(TextNodeFields = exports.TextNodeFields || (exports.TextNodeFields = {}));
var ElementNodeFields;
(function (ElementNodeFields) {
    ElementNodeFields["Type"] = "type";
    ElementNodeFields["Children"] = "children";
})(ElementNodeFields = exports.ElementNodeFields || (exports.ElementNodeFields = {}));
var LinkNodeFields;
(function (LinkNodeFields) {
    LinkNodeFields["URL"] = "url";
    LinkNodeFields["Title"] = "title";
})(LinkNodeFields = exports.LinkNodeFields || (exports.LinkNodeFields = {}));
var TableCellNodeFields;
(function (TableCellNodeFields) {
    TableCellNodeFields["Bordercolor"] = "borderColor";
})(TableCellNodeFields = exports.TableCellNodeFields || (exports.TableCellNodeFields = {}));
exports.GraphQLRichText = new graphql_1.GraphQLScalarType({
    name: 'RichText',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        return parseRichTextNodes(value);
    },
    parseLiteral(literal) {
        return parseRichTextNodes((0, graphql_1.valueFromASTUntyped)(literal));
    }
});
function createRichTextError(message, path) {
    return new Error(path.length > 0 ? `Error at path "${path.join('.')}": ${message}` : message);
}
exports.createRichTextError = createRichTextError;
const TextNodeFieldsArr = Object.values(TextNodeFields);
const ElmentNodeFieldsArr = Object.values(ElementNodeFields);
const LinkNodeFieldsArr = [
    ...Object.values(ElementNodeFields),
    ...Object.values(LinkNodeFields)
];
const TableCellNodeFieldsArr = [
    ...Object.values(ElementNodeFields),
    ...Object.values(TableCellNodeFields)
];
const ElementNodeTypeArr = Object.values(ElementNodeType);
function parseRichTextNode(value, path = []) {
    if (!(0, utility_1.isObject)(value)) {
        throw createRichTextError(`Expected object, found ${value}.`, path);
    }
    const isTextNode = value.text != undefined;
    const isElementNode = value.children != undefined;
    if (isTextNode && isElementNode) {
        throw createRichTextError(`Field "text" and "children" are mutually exclusive.`, path);
    }
    if (isTextNode) {
        for (const field of Object.keys(value)) {
            if (!TextNodeFieldsArr.includes(field)) {
                throw createRichTextError(`Unknown TextNode field "${field}".`, path);
            }
        }
        if (!(0, utility_1.isString)(value.text)) {
            throw createRichTextError(`Expected string found ${value.text}`, [...path, 'text']);
        }
        if (value.bold != undefined && !(0, utility_1.isBoolean)(value.bold)) {
            throw createRichTextError(`Expected boolean found ${value.bold}`, [...path, 'bold']);
        }
        if (value.italic != undefined && !(0, utility_1.isBoolean)(value.italic)) {
            throw createRichTextError(`Expected boolean found ${value.italic}`, [...path, 'italic']);
        }
        if (value.underline != undefined && !(0, utility_1.isBoolean)(value.underline)) {
            throw createRichTextError(`Expected boolean found ${value.underline}`, [...path, 'underline']);
        }
        if (value.strikethrough != undefined && !(0, utility_1.isBoolean)(value.strikethrough)) {
            throw createRichTextError(`Expected boolean found ${value.strikethrough}`, [
                ...path,
                'strikethrough'
            ]);
        }
        if (value.superscript != undefined && !(0, utility_1.isBoolean)(value.superscript)) {
            throw createRichTextError(`Expected boolean found ${value.superscript}`, [
                ...path,
                'superscript'
            ]);
        }
        if (value.subscript != undefined && !(0, utility_1.isBoolean)(value.subscript)) {
            throw createRichTextError(`Expected boolean found ${value.subscript}`, [...path, 'subscript']);
        }
        return Object.assign({ text: value.text }, value.bold != undefined ? { bold: value.bold } : {}, value.italic != undefined ? { italic: value.italic } : {}, value.underline != undefined ? { underline: value.underline } : {}, value.strikethrough != undefined ? { strikethrough: value.strikethrough } : {}, value.superscript != undefined ? { superscript: value.superscript } : {}, value.subscript != undefined ? { subscript: value.subscript } : {});
    }
    else {
        const isLinkNode = value.type === ElementNodeType.Link;
        const isTableCellNode = value.type === ElementNodeType.TableCell;
        for (const field of Object.keys(value)) {
            if (isLinkNode) {
                if (!LinkNodeFieldsArr.includes(field)) {
                    throw createRichTextError(`Unknown LinkNode field "${field}".`, path);
                }
            }
            else if (isTableCellNode) {
                if (!TableCellNodeFieldsArr.includes(field)) {
                    throw createRichTextError(`Unknown TableCellNode field "${field}".`, path);
                }
            }
            else {
                if (!ElmentNodeFieldsArr.includes(field)) {
                    throw createRichTextError(`Unknown ElementNode field "${field}".`, path);
                }
            }
        }
        if (!(0, utility_1.isArray)(value.children)) {
            throw createRichTextError(`Expected array found ${value.children}`, [...path, 'children']);
        }
        if (!(0, utility_1.isString)(value.type) || !ElementNodeTypeArr.includes(value.type)) {
            throw createRichTextError(`Expected one of ${JSON.stringify(ElementNodeTypeArr)} found ${value.type}`, [...path, 'type']);
        }
        const type = value.type;
        switch (type) {
            case ElementNodeType.Link: {
                if (!(0, utility_1.isString)(value.url)) {
                    // TODO: Check URL for malicious content.
                    throw createRichTextError(`Expected string found ${value.url}`, [...path, 'url']);
                }
                if (value.title != undefined && !(0, utility_1.isString)(value.title)) {
                    throw createRichTextError(`Expected string found ${value.title}`, [...path, 'title']);
                }
                return Object.assign({
                    type,
                    url: value.url,
                    children: parseRichTextNodes(value.children, [...path, 'children'])
                }, value.title != undefined ? { title: value.title } : {});
            }
            case ElementNodeType.TableCell: {
                if (!(0, utility_1.isString)(value.borderColor)) {
                    // TODO: Check URL for malicious content.
                    throw createRichTextError(`Expected string found ${value.borderColor}`, [
                        ...path,
                        'borderColor'
                    ]);
                }
                return {
                    type,
                    borderColor: value.borderColor,
                    children: parseRichTextNodes(value.children, [...path, 'children'])
                };
            }
            default:
                return {
                    type,
                    children: parseRichTextNodes(value.children, [...path, 'children'])
                };
        }
    }
}
exports.parseRichTextNode = parseRichTextNode;
function parseRichTextNodes(value, path = []) {
    if (!Array.isArray(value)) {
        throw createRichTextError(`Expected array, found ${typeof value}.`, path);
    }
    return value.map((value, index) => parseRichTextNode(value, [...path, index.toString()]));
}
exports.parseRichTextNodes = parseRichTextNodes;
//# sourceMappingURL=richText.js.map