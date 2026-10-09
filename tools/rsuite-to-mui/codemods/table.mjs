/**
 * rsuite `Table` -> the editor's `DataTable` (TanStack + MUI).
 *
 * rsuite declares columns as children; TanStack takes an array. The child
 * shape is regular enough to lift:
 *
 *   <Table data={rows} loading={l}>
 *     <Column width={300} resizable>
 *       <HeaderCell>{t('title')}</HeaderCell>
 *       <Cell>{(row: RowDataType<T>) => <Link …/>}</Cell>
 *     </Column>
 *   </Table>
 *
 *     -> <DataTable
 *          data={rows}
 *          loading={l}
 *          columns={[
 *            {
 *              id: 'title',
 *              label: t('title'),
 *              width: 300,
 *              render: (row: T) => <Link …/>,
 *            },
 *          ]}
 *        />
 *
 * Tables whose children are not plain `<Column>` elements (a map, a
 * conditional, a `{renderListColumns(...)}` call) are left alone and reported.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const findTagEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (c === '>' && depth === 0) return i;
  }
  return -1;
};

/** Matching close for `<Name …>` whose opening tag ends at `from`. */
const closeOf = (src, from, name) => {
  let depth = 1;
  const re = new RegExp(`<(\\/?)${name}(?=[\\s/>])`, 'g');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === '/') {
      if (--depth === 0)
        return { start: m.index, end: m.index + `</${name}>`.length };
    } else {
      const e = findTagEnd(src, m.index);
      if (e !== -1 && !src.slice(m.index, e).trimEnd().endsWith('/')) depth++;
    }
  }
  return null;
};

const takeAttr = (span, name) => {
  let depth = 0;
  for (let i = 0; i < span.length; i++) {
    const c = span[i];
    if (c === '{') {
      depth++;
      continue;
    }
    if (c === '}') {
      depth--;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < span.length && span[i] !== q) {
        if (span[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (depth !== 0) continue;
    if (i !== 0 && !/\s/.test(span[i - 1])) continue;
    if (!span.startsWith(name, i)) continue;
    const after = span[i + name.length];
    if (after !== undefined && /[\w$-]/.test(after)) continue;

    let j = i + name.length;
    while (j < span.length && /\s/.test(span[j])) j++;
    if (span[j] !== '=') {
      return [span.slice(0, i) + span.slice(i + name.length), true, true];
    }
    j++;
    while (j < span.length && /\s/.test(span[j])) j++;

    let value;
    let valueEnd;
    if (span[j] === '"' || span[j] === "'") {
      const q = span[j];
      let k = j + 1;
      while (k < span.length && span[k] !== q) k++;
      value = `'${span.slice(j + 1, k)}'`;
      valueEnd = k + 1;
    } else if (span[j] === '{') {
      let d = 0;
      let k = j;
      for (; k < span.length; k++) {
        if (span[k] === '{') d++;
        else if (span[k] === '}' && --d === 0) break;
      }
      value = span.slice(j + 1, k).trim();
      valueEnd = k + 1;
    } else {
      continue;
    }
    return [span.slice(0, i) + span.slice(valueEnd), value, true];
  }
  return [span, undefined, false];
};

/** Strip one level of `{ … }` if the whole string is a single container. */
const unwrapBraces = text => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  let depth = 0;
  for (let i = 0; i < trimmed.length - 1; i++) {
    if (trimmed[i] === '{') depth++;
    else if (trimmed[i] === '}' && --depth === 0) return null;
  }
  return trimmed.slice(1, -1).trim();
};

const CELL_TAGS = ['Cell', 'RCell', 'PaddedCell', 'IconButtonCell'];

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;
  const before = converted;

  // Normalise the alias and dotted spellings so one parser handles them all:
  // `<RTable>`, `<RTable.Column>`, `<Table.Cell>` …
  src = src
    .replace(/<(\/?)RTable\./g, '<$1')
    .replace(/<(\/?)Table\./g, '<$1')
    .replace(/<(\/?)RTable(?=[\s/>])/g, '<$1Table');

  for (let guard = 0; guard < 50; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<Table(?=[\s>])/g)) last = m.index;
    if (last === -1) break;

    const attrsFrom = last + '<Table'.length;
    const end = findTagEnd(src, attrsFrom);
    if (end === -1) break;
    const close = closeOf(src, end, 'Table');
    if (!close) break;

    const body = src.slice(end + 1, close.start);
    let span = src.slice(attrsFrom, end);

    const park = () => {
      skipped.push(file);
      src =
        src.slice(0, last) +
        '<TableKEEP' +
        src
          .slice(last + '<Table'.length, close.end)
          .replace(/<\/Table>$/, '</TableKEEP>') +
        src.slice(close.end);
    };

    // Columns must all be plain <Column> elements.
    const stray = body
      .replace(/<Column[\s\S]*?<\/Column>/g, '')
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
      .trim();
    if (stray || !body.includes('<Column')) {
      park();
      continue;
    }

    const columns = [];
    let ok = true;
    for (const colMatch of body.matchAll(/<Column([\s\S]*?)>([\s\S]*?)<\/Column>/g)) {
      let colSpan = colMatch[1];
      const colBody = colMatch[2];

      let width;
      let minWidth;
      let flexGrow;
      let align;
      let fixed;
      [colSpan, width] = takeAttr(colSpan, 'width');
      [colSpan, minWidth] = takeAttr(colSpan, 'minWidth');
      [colSpan, flexGrow] = takeAttr(colSpan, 'flexGrow');
      [colSpan, align] = takeAttr(colSpan, 'align');
      [colSpan, fixed] = takeAttr(colSpan, 'fixed');
      [colSpan] = takeAttr(colSpan, 'resizable');
      [colSpan] = takeAttr(colSpan, 'sortable');
      [colSpan] = takeAttr(colSpan, 'verticalAlign');

      const headerMatch = colBody.match(
        /<HeaderCell[^>]*>([\s\S]*?)<\/HeaderCell>/
      );
      const cellTag = CELL_TAGS.find(tag =>
        new RegExp(`<${tag}(?=[\\s/>])`).test(colBody)
      );
      if (!headerMatch || !cellTag) {
        ok = false;
        break;
      }

      const cellMatch = colBody.match(
        new RegExp(`<${cellTag}([^>]*)>([\\s\\S]*)</${cellTag}>`)
      );
      if (!cellMatch) {
        ok = false;
        break;
      }

      // A header may be one expression, plain text, or several children.
      const headerRaw = headerMatch[1].trim();
      const headerExpr = unwrapBraces(headerRaw);
      const header =
        headerExpr ? headerExpr
        : /[<{]/.test(headerRaw) ? `<>${headerRaw}</>`
        : `'${headerRaw.replace(/'/g, "\\'")}'`;

      const cellInner = unwrapBraces(cellMatch[2]);
      if (!cellInner) {
        ok = false;
        break;
      }

      // `(rowData: RowDataType<T>) => …` becomes `(rowData: T) => …`
      const render = cellInner.replace(/RowDataType<([^>]*)>/g, '$1');

      columns.push({
        header,
        render,
        width: width === undefined ? undefined : String(width),
        minWidth: minWidth === undefined ? undefined : String(minWidth),
        flexGrow: flexGrow === undefined ? undefined : String(flexGrow),
        align: align === undefined ? undefined : String(align),
        fixed,
      });
    }

    if (!ok || !columns.length) {
      park();
      continue;
    }

    // Table-level props.
    let data;
    let loading;
    let rowKey;
    let rowClassName;
    [span, data] = takeAttr(span, 'data');
    [span, loading] = takeAttr(span, 'loading');
    [span, rowKey] = takeAttr(span, 'rowKey');
    [span, rowClassName] = takeAttr(span, 'rowClassName');
    for (const dead of [
      'fillHeight',
      'autoHeight',
      'rowHeight',
      'headerHeight',
      'virtualized',
      'affixHorizontalScrollbar',
      'bordered',
      'cellBordered',
      'wordWrap',
      'hover',
      'shouldUpdateScroll',
      'renderEmpty',
      'height',
      'style',
      'minHeight',
      'sortColumn',
      'sortType',
      'onSortColumn',
      'rowSelection',
      'onRowClick',
      'defaultSortType',
    ]) {
      [span] = takeAttr(span, dead);
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const i2 = indent + '  ';
    const i3 = i2 + '  ';
    const i4 = i3 + '  ';

    const columnLines = columns
      .map((column, index) => {
        const entries = [
          `id: '${slug(column.header, index)}'`,
          `label: ${column.header}`,
          column.width ? `width: ${column.width}` : '',
          column.minWidth ? `minWidth: ${column.minWidth}` : '',
          column.align ? `align: ${column.align}` : '',
          column.fixed ? `fixed: true` : '',
          `render: ${column.render}`,
        ].filter(Boolean);
        return (
          `${i3}{\n` +
          entries.map(entry => `${i4}${entry},`).join('\n') +
          `\n${i3}}`
        );
      })
      .join(',\n');

    const rest = span.replace(/\s+/g, ' ').trim();
    const props = [
      data !== undefined ? `data={${data}}` : '',
      loading !== undefined ? `loading={${loading}}` : '',
      rowKey !== undefined ? `getRowId={row => String(row[${rowKey}])}` : '',
      rowClassName !== undefined ? `rowClassName={${rowClassName}}` : '',
      rest,
    ].filter(Boolean);

    const replacement =
      `<DataTable\n` +
      props.map(p => `${i2}${p}\n`).join('') +
      `${i2}columns={[\n${columnLines},\n${i2}]}\n` +
      `${indent}/>`;

    src = src.slice(0, last) + replacement + src.slice(close.end);
    converted++;
  }

  src = src.split('<TableKEEP').join('<Table').split('</TableKEEP>').join('</Table>');

  // The alias/dotted normalisation above must not survive a table this
  // codemod decided not to convert.
  if (converted === before) continue;

  if (src !== original) writeFileSync(file, src);
}

/** A stable column id derived from its header expression. */
function slug(header, index) {
  const text = header.match(/'([^']+)'|"([^"]+)"/);
  const raw = text ? text[1] ?? text[2] : '';
  const cleaned = raw
    .split('.')
    .pop()
    ?.replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return cleaned || `column-${index + 1}`;
}

console.log(`converted ${converted} tables`);
if (skipped.length) {
  console.log(`\nleft for manual conversion (${[...new Set(skipped)].length}):`);
  [...new Set(skipped)].forEach(s => console.log('  ' + s));
}
