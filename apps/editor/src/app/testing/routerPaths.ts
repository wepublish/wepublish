import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

import de from '../locales/de.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

type Catalog = { [key: string]: string | Catalog };

export const catalogs = {
  en: en.translation as Catalog,
  de: de.translation as Catalog,
  fr: fr.translation as Catalog,
};

export const lookup = (catalog: Catalog, key: string) =>
  key
    .split('.')
    .reduce<string | Catalog | undefined>(
      (value, part) =>
        value && typeof value !== 'string' ? value[part] : undefined,
      catalog
    );

const pathOf = (tag: ts.JsxOpeningLikeElement) => {
  if (tag.tagName.getText() !== 'Route') {
    return undefined;
  }

  const attribute = tag.attributes.properties.find(
    property =>
      ts.isJsxAttribute(property) && property.name.getText() === 'path'
  );

  return (
      attribute &&
        ts.isJsxAttribute(attribute) &&
        attribute.initializer &&
        ts.isStringLiteral(attribute.initializer)
    ) ?
      attribute.initializer.text
    : undefined;
};

/** A route that only sends old links on, e.g. `<RedirectToEngagementRule />`. */
const isRedirect = (tag: ts.JsxOpeningLikeElement) => {
  const element = tag.attributes.properties.find(
    property =>
      ts.isJsxAttribute(property) && property.name.getText() === 'element'
  );
  const expression =
    (
      element &&
      ts.isJsxAttribute(element) &&
      element.initializer &&
      ts.isJsxExpression(element.initializer)
    ) ?
      element.initializer.expression
    : undefined;

  return (
    !!expression &&
    (ts.isJsxSelfClosingElement(expression) || ts.isJsxElement(expression)) &&
    /^(Navigate|Redirect\w*)$/.test(
      (ts.isJsxElement(expression) ?
        expression.openingElement
      : expression
      ).tagName.getText()
    )
  );
};

/**
 * Every route path in app.tsx, a nested route joined to its parents. Routes
 * that only redirect are left out: they are no destination of their own.
 */
export const routerPaths = () => {
  const file = ts.createSourceFile(
    'app.tsx',
    readFileSync(join(__dirname, '../app.tsx'), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const paths: string[] = [];

  const visit = (node: ts.Node, parent: string) => {
    const tag =
      ts.isJsxElement(node) ? node.openingElement
      : ts.isJsxSelfClosingElement(node) ? node
      : undefined;
    const path = tag && pathOf(tag);
    const full =
      path === undefined ? parent : (
        `${parent.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
      );

    if (path !== undefined && tag && !isRedirect(tag)) {
      paths.push(full);
    }

    ts.forEachChild(node, child => visit(child, full));
  };

  visit(file, '');

  return paths;
};
