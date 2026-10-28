#!/usr/bin/env node
/**
 * Codemod: route `@wepublish/utils/website` imports to the right barrel.
 *
 * `@wepublish/utils/website`      -> framework-neutral core
 * `@wepublish/utils/website/next` -> Next.js-only (pages-router components,
 *                                    their data fetchers, next/router wrappers)
 *
 * The two barrels are disjoint — `/next` does not re-export the core — so a
 * file that uses both ends up with two import statements.
 *
 * Idempotent: re-running changes nothing. Run it again after any rebase that
 * adds new call sites.
 *
 *   node tools/split-utils-website-imports.mjs            # apply
 *   node tools/split-utils-website-imports.mjs --dry-run  # report only
 *
 * NEXT_ONLY below must match the exports reachable from
 * `libs/utils/website/src/next.ts`. To regenerate after changing that barrel:
 *   pnpm tsc -p libs/utils/website/tsconfig.lib.json --noEmit
 * and fix whatever fails to resolve — a missed symbol is a loud compile error,
 * never a silent miscategorisation.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SPECIFIER = '@wepublish/utils/website';
const NEXT_SPECIFIER = '@wepublish/utils/website/next';

const NEXT_ONLY = new Set([
  // lib/*
  'withAuthGuard',
  'getSessionTokenProps',
  'NextWepublishLink',
  'handleJwtLogin',
  'RoutedAdminBar',
  'withBuilderRouter',
  // lib/pages/*
  'FourOhFourPage',
  'getFourOhFourStaticProps',
  'AuthorPage',
  'getAuthorStaticPaths',
  'getAuthorStaticProps',
  'DocumentProps',
  'DocumentHeadTags',
  'documentGetInitialProps',
  'SearchPage',
  'SearchPageGetServerSideProps',
  'SubscribePage',
  'TagPage',
  'TagPageGetStaticPaths',
  'TagPageGetStaticProps',
  'ProfilePage',
  'ProfileWrapper',
  'SubscriptionPage',
  'DeactivatedSubscriptionsPage',
]);

const dryRun = process.argv.includes('--dry-run');

const files = execFileSync('git', ['grep', '-l', '--', `from '${SPECIFIER}';`], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  // the barrels themselves and this script must not be rewritten
  .filter(f => !f.startsWith('libs/utils/website/src/'))
  .filter(f => !f.startsWith('tools/'));

/**
 * Matches a whole `import`/`export … from` statement, single- or multi-line,
 * braces only.
 *
 * `export { X as default } from '…'` matters as much as `import` here: the
 * tenant pages are mostly thin re-export shims
 * (`export {FourOhFourPage as default} from …`), so an import-only codemod
 * silently misses ~half the call sites and the apps fail to typecheck.
 */
const statementRe = new RegExp(
  String.raw`(import|export)\s+(type\s+)?\{([^}]*)\}\s*from\s*'${SPECIFIER.replace(/\//g, '\\/')}';`,
  'g'
);

const render = (specs, kind, isType, specifier) => {
  const kw = `${kind} ${isType ? 'type ' : ''}`;
  const single = `${kw}{ ${specs.join(', ')} } from '${specifier}';`;
  if (single.length <= 80) return single;
  return `${kw}{\n${specs.map(s => `  ${s},`).join('\n')}\n} from '${specifier}';`;
};

let changed = 0;
const report = [];

for (const file of files) {
  const before = readFileSync(file, 'utf8');

  const after = before.replace(statementRe, (match, kind, typeKw, body) => {
    const isType = Boolean(typeKw);
    const specs = body
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const core = [];
    const next = [];
    for (const spec of specs) {
      // `Foo as Bar` / `type Foo` -> classify on the ORIGINAL name, which is
      // the left side of `as` for both imports and re-exports.
      const imported = spec.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      (NEXT_ONLY.has(imported) ? next : core).push(spec);
    }

    if (!next.length) return match;
    if (!core.length) return render(next, kind, isType, NEXT_SPECIFIER);
    // core barrel first — it is the dependency direction
    return `${render(core, kind, isType, SPECIFIER)}\n${render(next, kind, isType, NEXT_SPECIFIER)}`;
  });

  if (after !== before) {
    changed++;
    const both = after.includes(`from '${SPECIFIER}';`) && after.includes(`from '${NEXT_SPECIFIER}';`);
    report.push(`${both ? 'SPLIT ' : 'MOVED '} ${file}`);
    if (!dryRun) writeFileSync(file, after);
  }
}

report.sort().forEach(l => console.log(l));
console.log(
  `\n${dryRun ? '[dry run] would change' : 'changed'} ${changed} of ${files.length} files importing ${SPECIFIER}`
);
