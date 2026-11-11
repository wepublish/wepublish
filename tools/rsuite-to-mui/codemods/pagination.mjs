/**
 * rsuite `Pagination` -> the editor's `Pagination` (MUI based).
 *
 * The shared component takes the same `{page, limit, setPage, setLimit}` state
 * the list views already hold, so the call sites collapse from a dozen rsuite
 * props to two.
 *
 *   <Pagination limit={limit} total={total} activePage={page}
 *               onChangePage={setPage} onChangeLimit={setLimit} … />
 *     -> <Pagination state={{page, limit, setPage, setLimit}} totalCount={total} />
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

const attrValue = (span, name) => {
  const re = new RegExp(
    `(^|\\s)${name}(?![\\w$-])\\s*=\\s*(?:"([^"]*)"|\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\})`
  );
  const hit = span.match(re);
  if (!hit) return undefined;
  return hit[2] !== undefined ? `'${hit[2]}'` : hit[3].trim();
};

let converted = 0;
const manual = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 50; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<Pagination(?=[\s/>])/g)) last = m.index;
    if (last === -1) break;

    const attrsFrom = last + '<Pagination'.length;
    const end = findTagEnd(src, attrsFrom);
    if (end === -1) break;

    const span = src.slice(attrsFrom, end);
    const selfClosing = span.trimEnd().endsWith('/');
    const tagEnd =
      selfClosing ? end + 1
      : src.indexOf('</Pagination>', end) + '</Pagination>'.length;

    // Already migrated?
    if (/(^|\s)state\s*=/.test(span)) break;

    const total = attrValue(span, 'total');
    const limit = attrValue(span, 'limit');
    const activePage = attrValue(span, 'activePage');
    const onChangePage = attrValue(span, 'onChangePage');
    const onChangeLimit = attrValue(span, 'onChangeLimit');

    if (!total || !limit || !activePage || !onChangePage) {
      manual.push(`${file} (missing props)`);
      src =
        src.slice(0, last) +
        '<PaginationKEEP' +
        src.slice(last + '<Pagination'.length, tagEnd)
          .replace('</Pagination>', '</PaginationKEEP>') +
        src.slice(tagEnd);
      continue;
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const setLimit =
      onChangeLimit ?? '() => undefined /* page size was fixed here */';

    const replacement =
      `<Pagination\n` +
      `${indent}  state={{\n` +
      `${indent}    page: ${activePage},\n` +
      `${indent}    limit: ${limit},\n` +
      `${indent}    setPage: ${onChangePage},\n` +
      `${indent}    setLimit: ${setLimit},\n` +
      `${indent}  }}\n` +
      `${indent}  totalCount={${total}}\n` +
      `${indent}/>`;

    src = src.slice(0, last) + replacement + src.slice(tagEnd);
    converted++;
  }

  src = src
    .split('<PaginationKEEP').join('<Pagination')
    .split('</PaginationKEEP>').join('</Pagination>');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} paginations`);
if (manual.length) {
  console.log(`\nleft alone (${manual.length}):`);
  [...new Set(manual)].forEach(m => console.log('  ' + m));
}
