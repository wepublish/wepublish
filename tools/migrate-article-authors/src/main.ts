/**
 * Migrates "composite" authors (e.g. "Jana Schmid (Text) und Simon Boschi (Bild)")
 * to the new per-article author structure (one author per person + a `role` on the
 * article revision author).
 *
 * Runs against the public/admin GraphQL API (no database access needed).
 *
 * Usage (from the repo root):
 *
 *   npx tsx tools/migrate-article-authors/src/main.ts analyze  [--out plan.json]
 *   npx tsx tools/migrate-article-authors/src/main.ts apply    --plan plan.json [--dry-run] [--limit N] [--only <articleId|slug>]
 *   npx tsx tools/migrate-article-authors/src/main.ts cleanup  --plan plan.json [--dry-run]
 *
 * Environment:
 *   WEPUBLISH_API_URL   default: https://api-hauptstadt.wepublish.cloud/v1
 *   WEPUBLISH_TOKEN     API token (Editor → Settings → Tokens). Needs a role that may
 *                       read/create/publish articles and read/create/update/delete authors.
 *   WEPUBLISH_EMAIL / WEPUBLISH_PASSWORD
 *                       alternative to WEPUBLISH_TOKEN: logs in as an editor user.
 *
 * `analyze` works without credentials (published articles only). `apply` and `cleanup`
 * require credentials and an API that already exposes `ArticleRevisionAuthorInput`.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  parse,
  Kind,
  type DocumentNode,
  type TypeNode,
  type FieldDefinitionNode,
  type InputValueDefinitionNode,
  type DefinitionNode,
} from 'graphql';
// eslint-disable-next-line @nx/enforce-module-boundaries -- standalone tsx script, no path aliases at runtime
import { slugify } from '../../../libs/utils/src/lib/slugify';

// ---------------------------------------------------------------------------
// Manual configuration – review before running `apply`
// ---------------------------------------------------------------------------

/**
 * Authors whose name cannot be parsed automatically, keyed by author slug.
 * Each entry lists the persons (and roles) the author stands for.
 * Authors with a blocking parse warning that are not listed here are left untouched.
 */
const OVERRIDES: Record<string, { name: string; role?: string }[]> = {
  'ronak-firouzi-aufgezeichnet-von-andrea-von-daeniken-text': [
    { name: 'Ronak Firouzi', role: 'Text' },
    { name: 'Andrea von Däniken', role: 'Aufzeichnung' },
  ],
  'ronak-firouzi-aufgezeichnet-von-andrea-von-daeniken': [
    { name: 'Ronak Firouzi' },
    { name: 'Andrea von Däniken', role: 'Aufzeichnung' },
  ],
  'ronak-firouzi-text-aufgezeichnet-von-andrea-von-daeniken': [
    { name: 'Ronak Firouzi', role: 'Text' },
    { name: 'Andrea von Däniken', role: 'Aufzeichnung' },
  ],
  'sophie-reinhardt-aufgezeichnet': [
    { name: 'Sophie Reinhardt', role: 'Aufzeichnung' },
  ],
  'edith-kraehenbuehl-aufgezeichnet': [
    { name: 'Edith Krähenbühl', role: 'Aufzeichnung' },
  ],
  'valeria-heintges-frida-magazin': [
    { name: 'Valeria Heintges', role: 'Frida-Magazin' },
  ],
  'shannon-hughes-frida-magazin': [
    { name: 'Shannon Hughes', role: 'Frida-Magazin' },
  ],
  'axel-simon-hochparterre': [{ name: 'Axel Simon', role: 'Hochparterre' }],
  'bettina-gugger-text-und-youssef-sayed-bilder-kairo': [
    { name: 'Bettina Gugger', role: 'Text' },
    { name: 'Youssef Sayed', role: 'Bilder, Kairo' },
  ],
  'victoria-habermacher-text-und-peter-schneider-keystone-bild': [
    { name: 'Victoria Habermacher', role: 'Text' },
    { name: 'Peter Schneider', role: 'Bild / Keystone' },
  ],
  // "Nicolai Morawitz (Text) und Christian" – probably an unfinished
  // "Christine Strub (Fotos)". Uncomment if that is correct:
  // 'nicolai-morawitz-text-und-christian': [
  //   { name: 'Nicolai Morawitz', role: 'Text' },
  //   { name: 'Christine Strub', role: 'Fotos' },
  // ],
};

/**
 * Person-name aliases (typos → canonical spelling). Applied after parsing.
 * Only clear typos are listed; ambiguous near-duplicates are reported by `analyze`.
 */
const ALIASES: Record<string, string> = {
  'Danielle Linger': 'Danielle Liniger',
  'Danielle Linier': 'Danielle Liniger',
  'Melisa Knüsel': 'Melissa Knüsel',
  'Severin Novacki': 'Severin Nowacki',
  'Sophie Reinhard': 'Sophie Reinhardt',
  'Andrian Müller': 'Adrian Müller',
  'Karin Scheidegger': 'Kari*n Scheidegger',
};

/** Roles considered "normal". Anything else is reported (but still migrated verbatim). */
const KNOWN_ROLES = new Set([
  'Text',
  'Bild',
  'Bilder',
  'Foto',
  'Fotos',
  'Illustration',
  'Interview',
  'Übersetzung',
  'Recherche',
  'Grafik',
  'Video',
  'Audio',
  'Stimme',
  'Moderation',
  'Aufzeichnung',
  'Fragebogen',
  'Haupttext',
  'Kasten',
  'Datenanalyse',
  'Text und Bild',
  'Text und Bilder',
  'Bilder und Text',
  'Text und Fotos',
  'Bild Archiv',
  'Bilder Archiv',
  'Geschäfts- und Redaktionsleitung',
  'Datenanalyse, Text',
]);

/** Defaults for authors that have to be created because the person only exists inside composites. */
const NEW_AUTHOR_DEFAULTS = {
  hideOnArticle: false,
  hideOnTeam: false,
  hideOnTeaser: false,
};

/** Input fields that do not exist on every concrete output type. */
const INPUT_DEFAULTS: Record<string, unknown> = {
  'SubscribeBlockLayoutConfigInput.showInput': false,
};

const DEFAULT_API_URL = 'https://api-hauptstadt.wepublish.cloud/v1';
const PEER_USER_AGENT = 'We.Publish/1.0 Peering';
const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type Args = { command: string; flags: Record<string, string | boolean> };

function parseArgs(argv: string[]): Args {
  const [command = 'analyze', ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { command, flags };
}

const log = (...parts: unknown[]) => console.log(...parts);
const warn = (...parts: unknown[]) => console.warn('⚠', ...parts);

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

class GraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors: { message: string; path?: unknown }[]
  ) {
    super(message);
  }
}

class Client {
  private token: string | null = null;
  private isApiToken = false;

  constructor(private readonly url: string) {}

  get authenticated() {
    return this.token !== null;
  }

  async authenticate() {
    if (process.env.WEPUBLISH_TOKEN) {
      this.token = process.env.WEPUBLISH_TOKEN;
      this.isApiToken = true;
      return;
    }

    const email = process.env.WEPUBLISH_EMAIL;
    const password = process.env.WEPUBLISH_PASSWORD;
    if (email && password) {
      const data = await this.request<{ createSession: { token: string } }>(
        LOGIN_MUTATION,
        { email, password }
      );
      this.token = data.createSession.token;
      this.isApiToken = false;
    }
  }

  async request<T>(
    query: string,
    variables?: Record<string, unknown>,
    attempt = 0
  ): Promise<T> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (this.token) {
      headers.authorization = `Bearer ${this.token}`;
      headers.preview = 'true';
    }
    if (this.isApiToken) {
      headers['user-agent'] = PEER_USER_AGENT;
    }

    let body: { data?: T; errors?: { message: string; path?: unknown }[] };
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });
      if (response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      body = (await response.json()) as typeof body;
    } catch (error) {
      if (attempt < 4) {
        await sleep(1000 * 2 ** attempt);
        return this.request<T>(query, variables, attempt + 1);
      }
      throw error;
    }

    if (body.errors?.length) {
      const transient = body.errors.every(e =>
        /timeout|connection terminated|ECONNRESET/i.test(e.message)
      );
      if (transient && attempt < 4) {
        await sleep(1000 * 2 ** attempt);
        return this.request<T>(query, variables, attempt + 1);
      }
      throw new GraphQLError(
        body.errors.map(e => e.message).join('\n'),
        body.errors
      );
    }

    return body.data as T;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Schema-driven block round-trip (BlockContent → BlockContentInput)
// ---------------------------------------------------------------------------

type NamedDef = DefinitionNode & { name: { value: string } };

class SchemaMapper {
  private defs = new Map<string, NamedDef>();
  private implementers = new Map<string, string[]>();
  private selectionCache = new Map<string, string>();

  constructor(doc: DocumentNode) {
    for (const def of doc.definitions) {
      if ('name' in def && def.name) {
        this.defs.set(def.name.value, def as NamedDef);
        if ('interfaces' in def && def.interfaces) {
          for (const iface of def.interfaces) {
            const list = this.implementers.get(iface.name.value) ?? [];
            list.push(def.name.value);
            this.implementers.set(iface.name.value, list);
          }
        }
      }
    }
  }

  private base(type: TypeNode): { name: string; nonNull: boolean } {
    let nonNull = false;
    let t = type;
    if (t.kind === Kind.NON_NULL_TYPE) {
      nonNull = true;
      t = t.type;
    }
    while (t.kind !== Kind.NAMED_TYPE) {
      t = t.type;
      if (t.kind === Kind.NON_NULL_TYPE) t = t.type;
    }
    return { name: t.name.value, nonNull };
  }

  private fields(
    typeName: string
  ): Map<string, FieldDefinitionNode | InputValueDefinitionNode> {
    const def = this.defs.get(typeName);
    const result = new Map<
      string,
      FieldDefinitionNode | InputValueDefinitionNode
    >();
    if (def && 'fields' in def && def.fields) {
      for (const field of def.fields) result.set(field.name.value, field);
    }
    return result;
  }

  private isLeaf(typeName: string) {
    const def = this.defs.get(typeName);
    return (
      !def ||
      def.kind === Kind.SCALAR_TYPE_DEFINITION ||
      def.kind === Kind.ENUM_TYPE_DEFINITION
    );
  }

  /** Union member type (e.g. ImageBlock) → key in the input object (e.g. image). */
  private unionKeyFor(inputTypeName: string, memberName: string) {
    for (const [key, field] of this.fields(inputTypeName)) {
      if (this.base(field.type).name === `${memberName}Input`) return key;
    }
    return null;
  }

  /** Builds a selection set on `outType` that contains everything `inType` needs. */
  selection(outType: string, inType: string, depth = 0): string {
    const cacheKey = `${outType}|${inType}|${depth}`;
    const cached = this.selectionCache.get(cacheKey);
    if (cached) return cached;

    const outDef = this.defs.get(outType);
    if (!outDef) throw new Error(`Unknown output type ${outType}`);

    let result: string;

    if (outDef.kind === Kind.UNION_TYPE_DEFINITION) {
      if (depth > 3) {
        result = '__typename';
      } else {
        const parts = ['__typename'];
        for (const member of outDef.types ?? []) {
          const key = this.unionKeyFor(inType, member.name.value);
          if (!key) continue; // e.g. UnknownBlock – has no input, detected while mapping
          const memberInput = this.base(
            this.fields(inType).get(key)!.type
          ).name;
          parts.push(
            `... on ${member.name.value} { ${this.selection(member.name.value, memberInput, depth + 1)} }`
          );
        }
        result = parts.join(' ');
      }
    } else {
      const outFields = this.fields(outType);
      const parts = ['__typename'];
      for (const [name, inField] of this.fields(inType)) {
        const inBase = this.base(inField.type);
        const outField = outFields.get(name);

        if (!outField) {
          if (outDef.kind === Kind.INTERFACE_TYPE_DEFINITION) {
            const owners = (this.implementers.get(outType) ?? []).filter(impl =>
              this.fields(impl).has(name)
            );
            for (const impl of owners) {
              const implField = this.fields(impl).get(name)!;
              const sub =
                this.isLeaf(this.base(implField.type).name) ? name : (
                  `${name} { ${this.selection(this.base(implField.type).name, inBase.name, depth + 1)} }`
                );
              parts.push(`... on ${impl} { ${sub} }`);
            }
            if (owners.length) continue;
          }
          if (inBase.nonNull && !(`${inType}.${name}` in INPUT_DEFAULTS)) {
            throw new Error(
              `Cannot round-trip ${inType}.${name}: not present on ${outType}`
            );
          }
          continue;
        }

        const outBase = this.base(outField.type);
        if (this.isLeaf(outBase.name)) {
          parts.push(name);
        } else {
          parts.push(
            `${name} { ${this.selection(outBase.name, inBase.name, depth + 1)} }`
          );
        }
      }
      result = parts.join(' ');
    }

    this.selectionCache.set(cacheKey, result);
    return result;
  }

  /** Converts a fetched `outType` value to an `inType` input value. */
  toInput(
    value: unknown,
    outType: string,
    inType: string,
    at = inType
  ): unknown {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
      return value.map((item, i) =>
        this.toInput(item, outType, inType, `${at}[${i}]`)
      );
    }
    if (this.isLeaf(outType)) return value;

    const outDef = this.defs.get(outType);
    if (!outDef) throw new Error(`Unknown output type ${outType}`);
    const obj = value as Record<string, unknown>;

    if (outDef.kind === Kind.UNION_TYPE_DEFINITION) {
      const typename = obj.__typename as string | undefined;
      if (!typename) throw new Error(`${at}: missing __typename`);
      const key = this.unionKeyFor(inType, typename);
      if (!key)
        throw new Error(
          `${at}: ${typename} cannot be written back (no input type)`
        );
      if (Object.keys(obj).length === 1) {
        throw new Error(`${at}: ${typename} nested too deep to round-trip`);
      }
      const memberInput = this.base(this.fields(inType).get(key)!.type).name;
      return {
        [key]: this.toInput(obj, typename, memberInput, `${at}.${key}`),
      };
    }

    const result: Record<string, unknown> = {};
    for (const [name, inField] of this.fields(inType)) {
      const inBase = this.base(inField.type);
      if (!(name in obj)) {
        const defaultKey = `${inType}.${name}`;
        if (defaultKey in INPUT_DEFAULTS)
          result[name] = INPUT_DEFAULTS[defaultKey];
        else if (inBase.nonNull)
          throw new Error(`${at}.${name}: missing required field`);
        continue;
      }
      const fieldValue = obj[name];
      if (this.isLeaf(inBase.name) || fieldValue === null) {
        result[name] = fieldValue;
        continue;
      }
      const outFieldType = this.outFieldType(outType, obj, name);
      result[name] = this.toInput(
        fieldValue,
        outFieldType,
        inBase.name,
        `${at}.${name}`
      );
    }
    return result;
  }

  private outFieldType(
    outType: string,
    obj: Record<string, unknown>,
    field: string
  ) {
    const direct = this.fields(outType).get(field);
    if (direct) return this.base(direct.type).name;
    const typename = obj.__typename as string | undefined;
    const implField = typename ? this.fields(typename).get(field) : undefined;
    if (implField) return this.base(implField.type).name;
    throw new Error(`Cannot determine type of ${outType}.${field}`);
  }
}

// ---------------------------------------------------------------------------
// Name parsing
// ---------------------------------------------------------------------------

type Person = { name: string; role: string | null };
type Parsed = {
  people: Person[];
  warnings: string[];
  blocking: boolean;
  source: 'parsed' | 'override';
};

const normalize = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const applyAlias = (name: string) => ALIASES[name] ?? name;

function parseAuthorName(raw: string, slug: string): Parsed {
  const override = OVERRIDES[slug];
  if (override) {
    return {
      people: override.map(p => ({
        name: applyAlias(normalize(p.name)),
        role: p.role?.trim() || null,
      })),
      warnings: [],
      blocking: false,
      source: 'override',
    };
  }

  const warnings: string[] = [];
  const blockers: string[] = [];
  let s = normalize(raw);

  s = s.replace(/^[Vv]on\s+(?=\S)/, '');

  const opens = (s.match(/\(/g) ?? []).length;
  const closes = (s.match(/\)/g) ?? []).length;
  if (opens === closes + 1 && !s.endsWith(')')) {
    s += ')';
    warnings.push('added missing ")"');
  } else if (opens !== closes) {
    blockers.push('unbalanced parentheses');
  }

  if (/\baufgezeichnet\b/i.test(s))
    blockers.push('contains "aufgezeichnet" – needs OVERRIDES entry');

  const groups: { names: string; role: string | null }[] = [];
  const re = /([^()]+?)\s*\(([^()]*)\)|([^()]+)$/g;
  let match: RegExpExecArray | null;
  let consumed = 0;
  while ((match = re.exec(s))) {
    if (match.index !== consumed)
      blockers.push(`unparsed segment "${s.slice(consumed, match.index)}"`);
    consumed = match.index + match[0].length;
    if (match[3] !== undefined) groups.push({ names: match[3], role: null });
    else groups.push({ names: match[1], role: normalize(match[2]) || null });
  }
  if (consumed !== s.length) blockers.push(`trailing "${s.slice(consumed)}"`);

  const people: Person[] = [];
  for (const group of groups) {
    const names = normalize(group.names)
      .replace(/^(,|und)\s+/, '')
      .replace(/\s+(,|und)$/, '')
      .replace(/^,\s*/, '');
    if (!names) {
      if (group.role) blockers.push(`role "${group.role}" without a name`);
      continue;
    }
    let parts = names.split(/\s*,\s*|\s+und\s+/).filter(Boolean);
    if (parts.some(p => p.endsWith('-'))) parts = [names]; // "Stadt- und Landschaftsentwicklung"
    // "A, B, C (Text)": only the person directly before the parentheses gets the role
    parts.forEach((part, index) => {
      people.push({
        name: applyAlias(part),
        role: index === parts.length - 1 ? group.role : null,
      });
    });
  }

  const isComposite =
    people.length > 1 ||
    people.some(p => p.role) ||
    people[0]?.name !== normalize(raw);
  for (const p of people) {
    if (people.length > 1 && !/\s/.test(p.name))
      blockers.push(`single-word name "${p.name}" in composite`);
    else if (isComposite && !/\s/.test(p.name))
      warnings.push(`single-word name "${p.name}"`);
    if (/\//.test(p.name)) blockers.push(`slash in name "${p.name}"`);
    if (/\*$/.test(p.name))
      warnings.push(`asterisk at end of name "${p.name}"`);
    if (p.role && !KNOWN_ROLES.has(p.role))
      warnings.push(`unusual role "${p.role}"`);
  }
  if (!people.length) blockers.push('no person found');

  return {
    people,
    warnings: [...blockers, ...warnings],
    blocking: blockers.length > 0,
    source: 'parsed',
  };
}

// ---------------------------------------------------------------------------
// GraphQL documents (exported so they can be validated against the schema)
// ---------------------------------------------------------------------------

export const LOGIN_MUTATION = `mutation Login($email: String!, $password: String!) {
  createSession(email: $email, password: $password) { token }
}`;

export const AUTHOR_FIELDS = `id slug name jobTitle bio createdAt hideOnArticle hideOnTeam hideOnTeaser
  image { id } links { title url } tags { id tag }`;

export const AUTHORS_QUERY = `query Authors($skip: Int!, $take: Int!) {
  authors(skip: $skip, take: $take, sort: CreatedAt, order: Ascending) {
    totalCount nodes { ${AUTHOR_FIELDS} }
  }
}`;

export const AUTHOR_QUERY = `query Author($id: String!) { author(id: $id) { ${AUTHOR_FIELDS} } }`;

export const CREATE_AUTHOR_MUTATION = `mutation CreateAuthor($slug: Slug!, $name: String!, $hideOnArticle: Boolean!, $hideOnTeam: Boolean!, $hideOnTeaser: Boolean!) {
  createAuthor(slug: $slug, name: $name, hideOnArticle: $hideOnArticle, hideOnTeam: $hideOnTeam, hideOnTeaser: $hideOnTeaser, links: [], tagIds: []) { id }
}`;

export const UPDATE_AUTHOR_MUTATION = `mutation UpdateAuthor($id: String!, $slug: Slug, $name: String, $jobTitle: String, $bio: RichText, $imageID: String,
    $links: [AuthorLinkInput!], $tagIds: [String!], $hideOnArticle: Boolean, $hideOnTeam: Boolean, $hideOnTeaser: Boolean) {
  updateAuthor(id: $id, slug: $slug, name: $name, jobTitle: $jobTitle, bio: $bio, imageID: $imageID,
    links: $links, tagIds: $tagIds, hideOnArticle: $hideOnArticle, hideOnTeam: $hideOnTeam, hideOnTeaser: $hideOnTeaser) { id }
}`;

export const DELETE_AUTHOR_MUTATION = `mutation DeleteAuthor($id: String!) { deleteAuthor(id: $id) { id } }`;

export const UPDATE_ARTICLE_MUTATION = `mutation UpdateArticle($id: String!, $slug: String, $shared: Boolean!, $hidden: Boolean!, $disableComments: Boolean!, $likes: Int,
    $paywallId: String, $tagIds: [String!]!, $preTitle: String, $title: String, $lead: String, $seoTitle: String, $canonicalUrl: String!,
    $hideAuthor: Boolean!, $breaking: Boolean!, $socialMediaTitle: String, $socialMediaDescription: String, $imageID: String,
    $socialMediaImageID: String, $authors: [ArticleRevisionAuthorInput!]!, $socialMediaAuthorIds: [String!]!,
    $properties: [PropertyInput!]!, $blocks: [BlockContentInput!]!) {
  updateArticle(id: $id, slug: $slug, shared: $shared, hidden: $hidden, disableComments: $disableComments, likes: $likes,
    paywallId: $paywallId, tagIds: $tagIds, preTitle: $preTitle, title: $title, lead: $lead, seoTitle: $seoTitle, canonicalUrl: $canonicalUrl,
    hideAuthor: $hideAuthor, breaking: $breaking, socialMediaTitle: $socialMediaTitle, socialMediaDescription: $socialMediaDescription,
    imageID: $imageID, socialMediaImageID: $socialMediaImageID, authors: $authors, socialMediaAuthorIds: $socialMediaAuthorIds,
    properties: $properties, blocks: $blocks) { id }
}`;

export const PUBLISH_ARTICLE_MUTATION = `mutation Publish($id: String!, $publishedAt: DateTime!) {
  publishArticle(id: $id, publishedAt: $publishedAt) { id }
}`;

export const SHAPE_PROBE_QUERY = `{ articles(take: 1) { nodes { published { authors { role author { id } } } } } }`;

export function articlesLightQuery(
  shape: 'new' | 'old',
  authenticated: boolean
) {
  const rev = revisionSelection(shape);
  const privateFields = authenticated ? `draft { ${rev} } pending { id }` : '';
  return `query Articles($skip: Int!, $take: Int!) {
    articles(skip: $skip, take: $take, sort: CreatedAt, order: Ascending, filter: {}) {
      totalCount
      nodes { id slug url peer { id } published { ${rev} } ${privateFields} }
    }
  }`;
}

export function fullRevisionSelection(mapper: SchemaMapper) {
  const blocks = mapper.selection('BlockContent', 'BlockContentInput');
  const properties = mapper.selection('Property', 'PropertyInput');
  return `id publishedAt preTitle title lead seoTitle canonicalUrl hideAuthor breaking
    socialMediaTitle socialMediaDescription image { id } socialMediaImage { id }
    authors { role author { id } } socialMediaAuthors { id }
    properties { ${properties} } blocks { ${blocks} }`;
}

export function fullArticleQuery(revision: string) {
  return `query Article($id: String!) {
    article(id: $id) {
      id slug shared hidden disableComments likes paywallId peer { id } tags { id }
      pending { id }
      published { ${revision} }
      draft { ${revision} }
    }
  }`;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

type AuthorRec = {
  id: string;
  slug: string;
  name: string;
  jobTitle: string | null;
  bio: unknown | null;
  createdAt: string;
  hideOnArticle: boolean;
  hideOnTeam: boolean;
  hideOnTeaser: boolean;
  image: { id: string } | null;
  links: { title: string; url: string }[];
  tags: { id: string; tag: string | null }[];
};

type RevAuthor = { authorId: string; role: string | null };
type LightRevision = {
  id: string;
  publishedAt: string | null;
  title: string | null;
  authors: RevAuthor[];
  socialMediaAuthorIds: string[];
};
type LightArticle = {
  id: string;
  slug: string;
  url: string | null;
  peer: boolean;
  published: LightRevision | null;
  draft: LightRevision | null;
  pending: { id: string } | null;
};

async function fetchAllAuthors(client: Client): Promise<AuthorRec[]> {
  const authors: AuthorRec[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const data = await client.request<{
      authors: { totalCount: number; nodes: AuthorRec[] };
    }>(AUTHORS_QUERY, { skip, take: PAGE_SIZE });
    authors.push(...data.authors.nodes);
    if (authors.length >= data.authors.totalCount || !data.authors.nodes.length)
      break;
  }
  return authors;
}

/** New API: authors { role author { id } } – old API: authors { id }. */
async function detectAuthorShape(client: Client): Promise<'new' | 'old'> {
  try {
    await client.request(SHAPE_PROBE_QUERY);
    return 'new';
  } catch (error) {
    if (
      error instanceof GraphQLError &&
      /Cannot query field|Unknown field|"role"|'role'/.test(error.message)
    ) {
      return 'old';
    }
    throw error;
  }
}

function revisionSelection(shape: 'new' | 'old') {
  const authors =
    shape === 'new' ? 'authors { role author { id } }' : 'authors { id }';
  return `id publishedAt title ${authors} socialMediaAuthors { id }`;
}

function toLightRevision(
  rev: Record<string, any> | null,
  shape: 'new' | 'old'
): LightRevision | null {
  if (!rev) return null;
  return {
    id: rev.id,
    publishedAt: rev.publishedAt ?? null,
    title: rev.title ?? null,
    authors: rev.authors.map((a: any) =>
      shape === 'new' ?
        { authorId: a.author.id, role: a.role ?? null }
      : { authorId: a.id, role: null }
    ),
    socialMediaAuthorIds: rev.socialMediaAuthors.map((a: any) => a.id),
  };
}

async function fetchAllArticlesLight(
  client: Client,
  shape: 'new' | 'old'
): Promise<LightArticle[]> {
  const query = articlesLightQuery(shape, client.authenticated);
  const articles: LightArticle[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const data = await client.request<{
      articles: { totalCount: number; nodes: any[] };
    }>(query, { skip, take: PAGE_SIZE });
    for (const node of data.articles.nodes) {
      articles.push({
        id: node.id,
        slug: node.slug,
        url: node.url ?? null,
        peer: !!node.peer,
        published: toLightRevision(node.published, shape),
        draft: toLightRevision(node.draft ?? null, shape),
        pending: node.pending ?? null,
      });
    }
    process.stdout.write(
      `\r  fetched ${articles.length}/${data.articles.totalCount} articles`
    );
    if (
      articles.length >= data.articles.totalCount ||
      !data.articles.nodes.length
    )
      break;
  }
  process.stdout.write('\n');
  return articles;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

type AuthorFix = {
  id: string;
  slug: string;
  from: string;
  name?: string;
  newSlug?: string;
  fill?: {
    jobTitle?: string;
    imageID?: string;
    bio?: unknown;
    links?: { title: string; url: string }[];
  };
  fillSources?: string[];
};

type PersonPlan = {
  name: string;
  canonicalId: string | null; // null → author has to be created
  candidates: { id: string; slug: string; name: string; score: number }[];
  mergedFrom: { id: string; slug: string; name: string }[];
};

/** One original author entry on a revision and what it becomes. */
/** Author as shown in reports: `slug` is null for authors that still have to be created. */
type AuthorLabel = {
  name: string;
  slug: string | null;
  role: string | null;
  isNew?: boolean;
};

type AuthorMapping = {
  from: AuthorLabel;
  to: AuthorLabel[];
  changed: boolean;
};

type RevisionPlan = {
  revisionId: string;
  from: string[];
  to: RevAuthor[];
  /** human readable: "Name (slug)" → ["Name (slug) [role]", …] per original author */
  mappings: AuthorMapping[];
  socialMedia?: { from: AuthorLabel[]; to: AuthorLabel[] };
};

type ArticlePlan = {
  id: string;
  slug: string;
  title: string | null;
  url: string | null;
  published?: RevisionPlan;
  draft?: RevisionPlan;
  socialMediaChanged: boolean;
};

type Plan = {
  generatedAt: string;
  apiUrl: string;
  authenticated: boolean;
  includesDrafts: boolean;
  summary: Record<string, number>;
  /** authorId → replacement list (canonical authorId or "new:<name>" + role) */
  authorMap: Record<string, RevAuthor[]>;
  authorNames: Record<string, string>;
  authorSlugs: Record<string, string>;
  persons: PersonPlan[];
  authorsToCreate: { name: string; slug: string }[];
  authorFixes: AuthorFix[];
  authorsToDelete: { id: string; slug: string; name: string }[];
  blockedAuthors: {
    id: string;
    slug: string;
    name: string;
    warnings: string[];
    articles: number;
  }[];
  parseWarnings: { slug: string; name: string; warnings: string[] }[];
  roleHistogram: Record<string, number>;
  nearDuplicates: string[][];
  articles: ArticlePlan[];
  skippedArticles: { id: string; slug: string; reason: string }[];
};

function richTextHasContent(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(richTextHasContent);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string' && obj.text.trim()) return true;
    return Object.values(obj).some(
      v => typeof v === 'object' && richTextHasContent(v)
    );
  }
  return false;
}

function levenshtein(a: string, b: string) {
  const m: number[][] = [];
  for (let i = 0; i <= a.length; i++) m[i] = [i];
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return m[a.length][b.length];
}

function dedupeAuthors(authors: RevAuthor[]): RevAuthor[] {
  const result: RevAuthor[] = [];
  for (const author of authors) {
    const existing = result.find(a => a.authorId === author.authorId);
    if (!existing) result.push({ ...author });
    else if (!existing.role && author.role) existing.role = author.role;
  }
  return result;
}

function mapRevisionAuthors(
  authors: RevAuthor[],
  authorMap: Record<string, RevAuthor[]>
) {
  return dedupeAuthors(
    authors.flatMap(a => {
      const mapped = authorMap[a.authorId];
      if (!mapped) return [a];
      // keep an existing role if the mapping does not define one (single person case)
      return mapped.map(m => ({
        authorId: m.authorId,
        role: m.role ?? (mapped.length === 1 ? a.role : null),
      }));
    })
  );
}

function mapSocialMediaAuthors(
  ids: string[],
  authorMap: Record<string, RevAuthor[]>
) {
  return [
    ...new Set(
      ids.flatMap(id =>
        (authorMap[id] ?? [{ authorId: id }]).map(a => a.authorId)
      )
    ),
  ];
}

const sameAuthors = (a: RevAuthor[], b: RevAuthor[]) =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.authorId === b[i].authorId && (x.role ?? null) === (b[i].role ?? null)
  );

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

function buildPlan(
  apiUrl: string,
  client: Client,
  authors: AuthorRec[],
  articles: LightArticle[]
): Plan {
  const usage = new Map<string, number>();
  for (const article of articles) {
    for (const rev of [article.published, article.draft]) {
      if (!rev) continue;
      for (const a of rev.authors)
        usage.set(a.authorId, (usage.get(a.authorId) ?? 0) + 1);
      for (const id of rev.socialMediaAuthorIds)
        usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }

  const parsed = new Map<string, Parsed>();
  const parseWarnings: Plan['parseWarnings'] = [];
  const blockedAuthors: Plan['blockedAuthors'] = [];
  const roleHistogram: Record<string, number> = {};

  for (const author of authors) {
    const result = parseAuthorName(author.name, author.slug);
    parsed.set(author.id, result);
    if (result.warnings.length) {
      parseWarnings.push({
        slug: author.slug,
        name: author.name,
        warnings: result.warnings,
      });
    }
    if (result.blocking) {
      blockedAuthors.push({
        id: author.id,
        slug: author.slug,
        name: author.name,
        warnings: result.warnings,
        articles: usage.get(author.id) ?? 0,
      });
      continue;
    }
    for (const p of result.people)
      if (p.role) roleHistogram[p.role] = (roleHistogram[p.role] ?? 0) + 1;
  }

  // Group single-person authors by person name → candidates for the canonical author
  const persons = new Map<
    string,
    PersonPlan & { candidateRecs: AuthorRec[] }
  >();
  const personFor = (name: string) => {
    let person = persons.get(name);
    if (!person) {
      person = {
        name,
        canonicalId: null,
        candidates: [],
        mergedFrom: [],
        candidateRecs: [],
      };
      persons.set(name, person);
    }
    return person;
  };

  for (const author of authors) {
    const result = parsed.get(author.id)!;
    if (result.blocking) continue;
    for (const p of result.people) personFor(p.name);
    if (result.people.length === 1)
      personFor(result.people[0].name).candidateRecs.push(author);
  }

  const slugTaken = new Set(authors.map(a => a.slug));
  const authorFixes: AuthorFix[] = [];
  const authorsToCreate: Plan['authorsToCreate'] = [];
  const authorMap: Record<string, RevAuthor[]> = {};
  const authorsToDelete: Plan['authorsToDelete'] = [];

  for (const person of persons.values()) {
    const scored = person.candidateRecs.map(rec => {
      const parsedRec = parsed.get(rec.id)!;
      const isPlain =
        parsedRec.people[0].role === null &&
        normalize(rec.name) === person.name;
      let score = 0;
      if (isPlain) score += 1000;
      if (rec.image) score += 100;
      if (richTextHasContent(rec.bio)) score += 50;
      if (rec.jobTitle) score += 20;
      score += Math.min(rec.links.length, 3) * 10;
      if (rec.slug === slugify(person.name)) score += 1;
      score += Math.min(usage.get(rec.id) ?? 0, 400) / 40; // most used author wins ties (keeps the well-known URL)
      return { rec, score };
    });
    scored.sort(
      (a, b) =>
        b.score - a.score || a.rec.createdAt.localeCompare(b.rec.createdAt)
    );
    person.candidates = scored.map(({ rec, score }) => ({
      id: rec.id,
      slug: rec.slug,
      name: rec.name,
      score,
    }));

    const canonical = scored[0]?.rec ?? null;
    person.canonicalId = canonical?.id ?? null;

    if (!canonical) {
      let slug = slugify(person.name);
      let i = 2;
      while (slugTaken.has(slug)) slug = `${slugify(person.name)}-${i++}`;
      slugTaken.add(slug);
      authorsToCreate.push({ name: person.name, slug });
      continue;
    }

    const others = scored.slice(1).map(s => s.rec);
    const fix: AuthorFix = {
      id: canonical.id,
      slug: canonical.slug,
      from: canonical.name,
    };
    if (canonical.name !== person.name) {
      fix.name = person.name;
      const wantedSlug = slugify(person.name);
      if (canonical.slug !== wantedSlug) {
        if (!slugTaken.has(wantedSlug)) {
          fix.newSlug = wantedSlug;
          slugTaken.add(wantedSlug);
        }
      }
    }
    const fill: NonNullable<AuthorFix['fill']> = {};
    const fillSources: string[] = [];
    for (const other of others) {
      if (!canonical.jobTitle && other.jobTitle && !fill.jobTitle) {
        fill.jobTitle = other.jobTitle;
        fillSources.push(other.slug);
      }
      if (!canonical.image && other.image && !fill.imageID) {
        fill.imageID = other.image.id;
        fillSources.push(other.slug);
      }
      if (
        !richTextHasContent(canonical.bio) &&
        richTextHasContent(other.bio) &&
        !fill.bio
      ) {
        fill.bio = other.bio;
        fillSources.push(other.slug);
      }
      if (!canonical.links.length && other.links.length && !fill.links) {
        fill.links = other.links;
        fillSources.push(other.slug);
      }
    }
    if (Object.keys(fill).length) {
      fix.fill = fill;
      fix.fillSources = [...new Set(fillSources)];
    }
    if (fix.name || fix.newSlug || fix.fill) authorFixes.push(fix);

    for (const other of others) {
      person.mergedFrom.push({
        id: other.id,
        slug: other.slug,
        name: other.name,
      });
    }
  }

  // Build the author map (composite/variant author → canonical persons with roles)
  for (const author of authors) {
    const result = parsed.get(author.id)!;
    if (result.blocking) continue;
    const replacement = result.people.map(p => {
      const person = persons.get(p.name)!;
      return { authorId: person.canonicalId ?? `new:${p.name}`, role: p.role };
    });
    const identity =
      replacement.length === 1 &&
      replacement[0].authorId === author.id &&
      replacement[0].role === null;
    if (identity) continue;
    authorMap[author.id] = replacement;
    if (!replacement.some(r => r.authorId === author.id)) {
      authorsToDelete.push({
        id: author.id,
        slug: author.slug,
        name: author.name,
      });
    }
  }

  // Articles
  const articlePlans: ArticlePlan[] = [];
  const skippedArticles: Plan['skippedArticles'] = [];
  const authorById = new Map(authors.map(a => [a.id, a]));
  const plannedFix = new Map(authorFixes.map(f => [f.id, f]));
  const currentName = (id: string) => {
    const author = authorById.get(id);
    return author ? `${author.name} (${author.slug})` : id;
  };
  /** Author as it is today. */
  const currentLabel = (a: RevAuthor): AuthorLabel => {
    const author = authorById.get(a.authorId);
    return {
      name: author?.name ?? a.authorId,
      slug: author?.slug ?? null,
      role: a.role ?? null,
    };
  };
  /** Author as it will look after the migration (renamed canonical authors use their new name). */
  const plannedLabel = (a: RevAuthor): AuthorLabel => {
    if (a.authorId.startsWith('new:')) {
      return { name: a.authorId.slice(4), slug: null, role: a.role ?? null, isNew: true };
    }
    const author = authorById.get(a.authorId);
    const fix = plannedFix.get(a.authorId);
    return {
      name: fix?.name ?? author?.name ?? a.authorId,
      slug: fix?.newSlug ?? author?.slug ?? null,
      role: a.role ?? null,
    };
  };
  const mappingsFor = (revAuthors: RevAuthor[]): AuthorMapping[] =>
    revAuthors.map(a => {
      const mapped = authorMap[a.authorId];
      const to = mapped ? mapRevisionAuthors([a], authorMap) : [a];
      return {
        from: currentLabel(a),
        to: to.map(plannedLabel),
        changed: !!mapped,
      };
    });

  for (const article of articles) {
    const touched = [article.published, article.draft].some(
      rev =>
        rev &&
        (rev.authors.some(a => authorMap[a.authorId]) ||
          rev.socialMediaAuthorIds.some(id => authorMap[id]))
    );
    if (!touched) continue;
    if (article.peer) {
      skippedArticles.push({
        id: article.id,
        slug: article.slug,
        reason: 'peered article',
      });
      continue;
    }
    if (article.pending) {
      skippedArticles.push({
        id: article.id,
        slug: article.slug,
        reason: 'has a pending (scheduled) revision – migrate manually',
      });
      continue;
    }

    const plan: ArticlePlan = {
      id: article.id,
      slug: article.slug,
      title: article.published?.title ?? article.draft?.title ?? null,
      url: article.url,
      socialMediaChanged: false,
    };
    for (const key of ['published', 'draft'] as const) {
      const rev = article[key];
      if (!rev) continue;
      const to = mapRevisionAuthors(rev.authors, authorMap);
      const smTo = mapSocialMediaAuthors(rev.socialMediaAuthorIds, authorMap);
      if (
        !sameAuthors(rev.authors, to) ||
        !sameIds(rev.socialMediaAuthorIds, smTo)
      ) {
        plan[key] = {
          revisionId: rev.id,
          from: rev.authors.map(a => currentName(a.authorId)),
          to,
          mappings: mappingsFor(rev.authors),
        };
        if (!sameIds(rev.socialMediaAuthorIds, smTo)) {
          plan.socialMediaChanged = true;
          plan[key]!.socialMedia = {
            from: rev.socialMediaAuthorIds.map(id => currentLabel({ authorId: id, role: null })),
            to: smTo.map(id => plannedLabel({ authorId: id, role: null })),
          };
        }
      }
    }
    if (plan.published || plan.draft) articlePlans.push(plan);
  }

  // Near duplicates for the report
  const personNames = [...persons.keys()].sort();
  const nearDuplicates: string[][] = [];
  for (let i = 0; i < personNames.length; i++)
    for (let j = i + 1; j < personNames.length; j++) {
      const d = levenshtein(
        personNames[i].toLowerCase(),
        personNames[j].toLowerCase()
      );
      if (d > 0 && d <= 2)
        nearDuplicates.push([personNames[i], personNames[j]]);
    }

  return {
    generatedAt: new Date().toISOString(),
    apiUrl,
    authenticated: client.authenticated,
    includesDrafts: client.authenticated,
    summary: {
      authors: authors.length,
      articles: articles.length,
      persons: persons.size,
      personsWithCanonicalAuthor: [...persons.values()].filter(p => p.canonicalId).length,
      authorsToCreate: authorsToCreate.length,
      authorsMapped: Object.keys(authorMap).length,
      authorsToDelete: authorsToDelete.length,
      authorFixes: authorFixes.length,
      articlesToUpdate: articlePlans.length,
      publishedRevisionsToUpdate: articlePlans.filter(a => a.published).length,
      draftsToUpdate: articlePlans.filter(a => a.draft).length,
      socialMediaAuthorChanges: articlePlans.filter(a => a.socialMediaChanged).length,
      skippedArticles: skippedArticles.length,
      blockedAuthors: blockedAuthors.length,
    },
    authorMap,
    authorNames: Object.fromEntries(authors.map(a => [a.id, a.name])),
    authorSlugs: Object.fromEntries(authors.map(a => [a.id, a.slug])),
    persons: [...persons.values()].map(({ candidateRecs, ...p }) => p),
    authorsToCreate,
    authorFixes,
    authorsToDelete,
    blockedAuthors,
    parseWarnings,
    roleHistogram,
    nearDuplicates,
    articles: articlePlans,
    skippedArticles,
  };
}

function describeAuthor(plan: Plan, author: RevAuthor) {
  const name = plan.authorNames[author.authorId];
  const label =
    author.authorId.startsWith('new:') ?
      `${author.authorId.slice(4)} (new author)`
    : name ? `${name} (${plan.authorSlugs[author.authorId]})`
    : author.authorId;
  return author.role ? `${label} [${author.role}]` : label;
}

function printReport(plan: Plan) {
  const line = (s = '') => log(s);
  line();
  line('════════════════════════════════════════════════════════');
  line(` Author migration plan – ${plan.apiUrl}`);
  line(
    ` ${plan.authenticated ? 'authenticated (drafts included)' : 'anonymous (published articles only!)'}`
  );
  line('════════════════════════════════════════════════════════');

  const merges = plan.persons.filter(p => p.mergedFrom.length);
  line(
    `\n▸ Persons: ${plan.persons.length}  (canonical author exists: ${plan.persons.filter(p => p.canonicalId).length}, to create: ${plan.authorsToCreate.length})`
  );
  line(
    `▸ Authors mapped to other authors/roles: ${Object.keys(plan.authorMap).length}`
  );
  line(`▸ Authors to delete after migration: ${plan.authorsToDelete.length}`);
  line(`▸ Canonical authors to rename/complete: ${plan.authorFixes.length}`);
  line(
    `▸ Articles to update: ${plan.articles.length}  (published revisions: ${plan.articles.filter(a => a.published).length}, drafts: ${plan.articles.filter(a => a.draft).length}, social media authors: ${plan.articles.filter(a => a.socialMediaChanged).length})`
  );
  line(`▸ Articles skipped: ${plan.skippedArticles.length}`);
  line(
    `▸ Authors that cannot be parsed (left untouched): ${plan.blockedAuthors.length}`
  );

  line('\n── Persons merged from several authors ──');
  for (const p of merges) {
    const canonical = p.candidates[0];
    line(`  ${p.name}  ← keeps "${canonical.name}" (${canonical.slug})`);
    for (const m of p.mergedFrom) line(`      merges "${m.name}" (${m.slug})`);
  }

  line('\n── Authors to create (person only appears inside composites) ──');
  for (const a of plan.authorsToCreate) line(`  ${a.name}  (${a.slug})`);

  line('\n── Canonical authors to rename / complete ──');
  for (const f of plan.authorFixes) {
    const parts = [];
    if (f.name) parts.push(`name "${f.from}" → "${f.name}"`);
    if (f.newSlug) parts.push(`slug ${f.slug} → ${f.newSlug}`);
    if (f.fill)
      parts.push(
        `fill ${Object.keys(f.fill).join(', ')} from ${f.fillSources?.join(', ')}`
      );
    line(`  ${f.slug}: ${parts.join('; ')}`);
  }

  line('\n── Authors that need an OVERRIDES entry (not migrated) ──');
  for (const b of plan.blockedAuthors)
    line(
      `  "${b.name}" (${b.slug}) used by ${b.articles} article(s): ${b.warnings.join('; ')}`
    );

  line('\n── Non-blocking parse warnings ──');
  for (const w of plan.parseWarnings.filter(
    w => !plan.blockedAuthors.some(b => b.slug === w.slug)
  ))
    line(`  "${w.name}" (${w.slug}): ${w.warnings.join('; ')}`);

  line('\n── Roles (verbatim) ──');
  line(
    '  ' +
      Object.entries(plan.roleHistogram)
        .sort((a, b) => b[1] - a[1])
        .map(([r, n]) => `${r}: ${n}`)
        .join(', ')
  );

  line(
    '\n── Possible typos (not merged – add to ALIASES if they are the same person) ──'
  );
  for (const [a, b] of plan.nearDuplicates)
    if (!ALIASES[a] && !ALIASES[b]) line(`  ${a}  ~  ${b}`);

  line('\n── Skipped articles ──');
  for (const s of plan.skippedArticles)
    line(`  ${s.slug} (${s.id}): ${s.reason}`);

  line('\n── Article changes (first 15) ──');
  for (const a of plan.articles.slice(0, 15)) {
    const change = a.published ?? a.draft!;
    line(`  ${a.slug}`);
    line(`      ${change.from.join(' | ')}`);
    line(
      `    → ${change.to.map(t => `${describeAuthor(plan, t)}`).join(' | ')}`
    );
  }
  line();
}

// ---------------------------------------------------------------------------
// HTML report
// ---------------------------------------------------------------------------

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function renderHtmlReport(plan: Plan): string {
  const h = escapeHtml;
  const section = (title: string, body: string, count?: number) =>
    `<section><h2>${h(title)}${count !== undefined ? ` <small>${count}</small>` : ''}</h2>${body}</section>`;
  const table = (headers: string[], rows: string[][], className = '') =>
    rows.length ?
      `<table class="${className}"><thead><tr>${headers.map(x => `<th>${h(x)}</th>`).join('')}</tr></thead><tbody>${rows
        .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
    : '<p class="muted">none</p>';
  const list = (items: string[]) =>
    items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<p class="muted">none</p>';

  const summary = Object.entries(plan.summary)
    .map(([k, v]) => `<div class="card"><div class="num">${v}</div><div class="label">${h(k.replace(/([A-Z])/g, ' $1').toLowerCase())}</div></div>`)
    .join('');

  // slug only as tooltip, so the table stays readable
  const author = (a: AuthorLabel) =>
    `<span class="author" title="${h(a.slug ?? 'new author')}">${h(a.name)}${a.role ? ` <span class="role">[${h(a.role)}]</span>` : ''}${a.isNew ? ' <span class="new">new</span>' : ''}</span>`;
  const renderMappings = (rev: RevisionPlan) =>
    rev.mappings
      .map(
        m =>
          `<div class="map ${m.changed ? 'changed' : ''}"><span class="from">${author(m.from)}</span><span class="arrow">→</span><span class="to">${m.to.map(author).join('<br>')}</span></div>`
      )
      .join('') +
    (rev.socialMedia ?
      `<div class="map changed sm"><span class="from">social media: ${rev.socialMedia.from.map(author).join(', ') || '–'}</span><span class="arrow">→</span><span class="to">${rev.socialMedia.to.map(author).join(', ') || '–'}</span></div>`
    : '');

  const articleRows = plan.articles.flatMap(a =>
    (['published', 'draft'] as const)
      .filter(key => a[key])
      .map(key => [
        `<div class="title">${a.url ? `<a href="${h(a.url)}" target="_blank" rel="noopener">${h(a.title ?? a.slug)}</a>` : h(a.title ?? a.slug)}</div><code>${h(a.slug)}</code>`,
        `<span class="badge ${key}">${key}</span>`,
        renderMappings(a[key]!),
      ])
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Author migration plan – ${h(plan.apiUrl)}</title>
<style>
  body { font: 14px/1.45 system-ui, sans-serif; margin: 0; color: #1a1a1a; background: #f6f6f4; }
  main { max-width: 1200px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 32px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h2 small { color: #777; font-weight: normal; }
  .muted { color: #777; }
  .warn { background: #fff4d6; border: 1px solid #f0d58c; padding: 8px 12px; border-radius: 6px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 16px 0; }
  .card { background: #fff; border: 1px solid #e3e3e0; border-radius: 8px; padding: 10px 12px; }
  .card .num { font-size: 22px; font-weight: 600; }
  .card .label { color: #666; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #e3e3e0; }
  th, td { text-align: left; vertical-align: top; padding: 6px 10px; border-bottom: 1px solid #eee; }
  th { background: #f0f0ee; position: sticky; top: 0; }
  code { font-size: 12px; background: #eee; padding: 1px 4px; border-radius: 3px; }
  .title { font-weight: 600; }
  .badge { font-size: 11px; padding: 2px 6px; border-radius: 10px; background: #e2ecff; }
  .badge.draft { background: #ffe9c9; }
  .map { display: grid; grid-template-columns: minmax(200px, 1fr) 24px minmax(200px, 1fr); gap: 4px; padding: 3px 0; }
  .map .to { color: #0a6b2b; font-weight: 500; }
  .map.sm { border-top: 1px dashed #ddd; margin-top: 4px; padding-top: 6px; font-size: 13px; }
  .arrow { text-align: center; }
  .role { color: #666; font-weight: normal; }
  .new { font-size: 11px; padding: 1px 5px; border-radius: 8px; background: #e6f6ea; color: #0a6b2b; }
  #filter { width: 100%; padding: 8px 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 10px; box-sizing: border-box; }
  ul { margin: 4px 0; padding-left: 20px; }
</style>
</head>
<body>
<main>
<h1>Author migration plan</h1>
<p class="muted">${h(plan.apiUrl)} · generated ${h(plan.generatedAt)} · ${plan.authenticated ? 'authenticated (drafts included)' : 'anonymous (published articles only)'}</p>
${plan.includesDrafts ? '' : '<p class="warn">Generated without credentials: drafts and unpublished articles were not analysed.</p>'}
<div class="cards">${summary}</div>

${section('Roles (kept verbatim)', table(['Role', 'Occurrences'], Object.entries(plan.roleHistogram).sort((a, b) => b[1] - a[1]).map(([r, n]) => [h(r), String(n)])))}
${section('Possible typos (not merged – add to ALIASES if they are the same person)', list(plan.nearDuplicates.map(([a, b]) => `${h(a)} ~ ${h(b)}`)))}
${section('Skipped articles', table(['Article', 'Reason'], plan.skippedArticles.map(s => [`<code>${h(s.slug)}</code>`, h(s.reason)])), plan.skippedArticles.length)}

<section>
<h2>Article changes <small>${plan.articles.length} articles</small></h2>
<input id="filter" type="search" placeholder="Filter articles by title, slug or author …">
${table(['Article', 'Revision', 'Author mapping'], articleRows, 'articles')}
</section>
</main>
<script>
  const input = document.getElementById('filter');
  const rows = [...document.querySelectorAll('table.articles tbody tr')];
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    for (const row of rows) row.hidden = q !== '' && !row.textContent.toLowerCase().includes(q);
  });
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

type LogEntry = {
  ts: string;
  type: string;
  id: string;
  status: string;
  details?: unknown;
};

class ActionLog {
  private entries: LogEntry[] = [];
  constructor(private readonly file: string) {
    if (fs.existsSync(file)) {
      this.entries = fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    }
  }
  done(type: string, id: string) {
    return this.entries.some(
      e => e.type === type && e.id === id && e.status === 'done'
    );
  }
  find(type: string, id: string) {
    return this.entries.find(
      e => e.type === type && e.id === id && e.status === 'done'
    );
  }
  write(entry: Omit<LogEntry, 'ts'>) {
    const full = { ts: new Date().toISOString(), ...entry };
    this.entries.push(full);
    fs.appendFileSync(this.file, JSON.stringify(full) + '\n');
  }
}

function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          if (v[k] !== undefined) acc[k] = v[k];
          return acc;
        }, {});
    }
    return v;
  });
}

type FullRevision = {
  id: string;
  publishedAt: string | null;
  preTitle: string | null;
  title: string | null;
  lead: string | null;
  seoTitle: string | null;
  canonicalUrl: string | null;
  hideAuthor: boolean | null;
  breaking: boolean | null;
  socialMediaTitle: string | null;
  socialMediaDescription: string | null;
  image: { id: string } | null;
  socialMediaImage: { id: string } | null;
  authors: { role: string | null; author: { id: string } }[];
  socialMediaAuthors: { id: string }[];
  properties: { key: string; value: string; public: boolean }[];
  blocks: unknown[];
};

type FullArticle = {
  id: string;
  slug: string;
  shared: boolean;
  hidden: boolean;
  disableComments: boolean;
  likes: number | null;
  paywallId: string | null;
  peer: { id: string } | null;
  tags: { id: string }[];
  published: FullRevision | null;
  draft: FullRevision | null;
  pending: { id: string } | null;
};

type UpdateArticleVariables = ReturnType<Migrator['buildUpdateVariables']>['input'];

class Migrator {
  private readonly revisionSelection: string;
  private readonly createdAuthors = new Map<string, string>();

  constructor(
    private readonly client: Client,
    private readonly mapper: SchemaMapper,
    private readonly plan: Plan,
    private readonly actionLog: ActionLog,
    private readonly dryRun: boolean
  ) {
    this.revisionSelection = fullRevisionSelection(mapper);
  }

  // ---- authors --------------------------------------------------------------

  async createMissingAuthors() {
    if (!this.plan.authorsToCreate.length) return;
    log(`\n▸ Creating ${this.plan.authorsToCreate.length} missing author(s)`);
    const existing = await fetchAllAuthors(this.client);

    for (const toCreate of this.plan.authorsToCreate) {
      const logged = this.actionLog.find('author-create', toCreate.name);
      const found =
        (logged?.details as { id: string } | undefined)?.id ??
        existing.find(
          a =>
            normalize(a.name) === toCreate.name && !/[(),]| und /.test(a.name)
        )?.id;
      if (found) {
        this.createdAuthors.set(toCreate.name, found);
        log(`  ✓ ${toCreate.name} already exists (${found})`);
        continue;
      }
      let slug = toCreate.slug;
      let i = 2;
      while (existing.some(a => a.slug === slug))
        slug = `${toCreate.slug}-${i++}`;
      log(`  + ${toCreate.name} (${slug})`);
      if (this.dryRun) continue;
      const data = await this.client.request<{ createAuthor: { id: string } }>(
        CREATE_AUTHOR_MUTATION,
        { slug, name: toCreate.name, ...NEW_AUTHOR_DEFAULTS }
      );
      this.createdAuthors.set(toCreate.name, data.createAuthor.id);
      this.actionLog.write({
        type: 'author-create',
        id: toCreate.name,
        status: 'done',
        details: { id: data.createAuthor.id, slug },
      });
    }
  }

  async fixCanonicalAuthors() {
    if (!this.plan.authorFixes.length) return;
    log(
      `\n▸ Renaming / completing ${this.plan.authorFixes.length} canonical author(s)`
    );
    for (const fix of this.plan.authorFixes) {
      if (this.actionLog.done('author-fix', fix.id)) continue;
      const data = await this.client.request<{ author: AuthorRec }>(
        AUTHOR_QUERY,
        { id: fix.id }
      );
      const current = data.author;
      const variables = {
        id: current.id,
        name: fix.name ?? current.name,
        slug: fix.newSlug ?? current.slug,
        jobTitle: fix.fill?.jobTitle ?? current.jobTitle,
        bio: fix.fill?.bio ?? current.bio,
        imageID: fix.fill?.imageID ?? current.image?.id ?? null,
        links: (fix.fill?.links ?? current.links).map(({ title, url }) => ({
          title,
          url,
        })),
        tagIds: current.tags.map(t => t.id),
        hideOnArticle: current.hideOnArticle,
        hideOnTeam: current.hideOnTeam,
        hideOnTeaser: current.hideOnTeaser,
      };
      log(
        `  ~ ${current.slug}: "${current.name}" → "${variables.name}"${fix.newSlug ? ` (slug → ${fix.newSlug})` : ''}${fix.fill ? ` + ${Object.keys(fix.fill).join(', ')}` : ''}`
      );
      if (this.dryRun) continue;
      await this.client.request(UPDATE_AUTHOR_MUTATION, variables);
      this.actionLog.write({
        type: 'author-fix',
        id: fix.id,
        status: 'done',
        details: variables,
      });
    }
  }

  private resolveAuthorMap(): Record<string, RevAuthor[]> {
    const resolved: Record<string, RevAuthor[]> = {};
    for (const [id, replacements] of Object.entries(this.plan.authorMap)) {
      resolved[id] = replacements.map(r => {
        if (!r.authorId.startsWith('new:')) return r;
        const created = this.createdAuthors.get(r.authorId.slice(4));
        if (!created)
          throw new Error(`Author "${r.authorId.slice(4)}" was not created`);
        return { authorId: created, role: r.role };
      });
    }
    return resolved;
  }

  // ---- articles -------------------------------------------------------------

  private async fetchArticle(id: string): Promise<FullArticle> {
    const data = await this.client.request<{ article: FullArticle }>(
      fullArticleQuery(this.revisionSelection),
      { id }
    );
    return data.article;
  }

  private buildUpdateVariables(
    article: FullArticle,
    revision: FullRevision,
    authorMap: Record<string, RevAuthor[]>
  ) {
    const currentAuthors: RevAuthor[] = revision.authors.map(a => ({
      authorId: a.author.id,
      role: a.role ?? null,
    }));
    const authors = mapRevisionAuthors(currentAuthors, authorMap);
    const socialMediaAuthorIds = mapSocialMediaAuthors(
      revision.socialMediaAuthors.map(a => a.id),
      authorMap
    );
    const blocks = this.mapper.toInput(
      revision.blocks,
      'BlockContent',
      'BlockContentInput'
    );
    const properties = this.mapper.toInput(
      revision.properties,
      'Property',
      'PropertyInput'
    );

    const changed =
      !sameAuthors(currentAuthors, authors) ||
      !sameIds(
        revision.socialMediaAuthors.map(a => a.id),
        socialMediaAuthorIds
      );

    const input = {
      id: article.id,
      slug: article.slug,
      shared: article.shared,
      hidden: article.hidden,
      disableComments: article.disableComments,
      likes: article.likes,
      paywallId: article.paywallId,
      tagIds: article.tags.map(t => t.id),
      preTitle: revision.preTitle,
      title: revision.title,
      lead: revision.lead,
      seoTitle: revision.seoTitle,
      canonicalUrl: revision.canonicalUrl ?? '',
      hideAuthor: revision.hideAuthor ?? false,
      breaking: revision.breaking ?? false,
      socialMediaTitle: revision.socialMediaTitle,
      socialMediaDescription: revision.socialMediaDescription,
      imageID: revision.image?.id ?? null,
      socialMediaImageID: revision.socialMediaImage?.id ?? null,
      authors,
      socialMediaAuthorIds,
      properties,
      blocks,
    };

    return { changed, input };
  }

  private async updateArticle(variables: UpdateArticleVariables) {
    await this.client.request(UPDATE_ARTICLE_MUTATION, variables);

    // Verify: the new draft must contain exactly what we sent
    const after = await this.fetchArticle(variables.id);
    const draft = after.draft;
    if (!draft) throw new Error(`${variables.slug}: no draft after update`);
    const mismatches: string[] = [];
    const check = (name: string, sent: unknown, got: unknown) => {
      if (stable(sent) !== stable(got)) mismatches.push(name);
    };
    check(
      'blocks',
      variables.blocks,
      this.mapper.toInput(draft.blocks, 'BlockContent', 'BlockContentInput')
    );
    check(
      'properties',
      variables.properties,
      this.mapper.toInput(draft.properties, 'Property', 'PropertyInput')
    );
    check(
      'authors',
      variables.authors,
      draft.authors.map(a => ({ authorId: a.author.id, role: a.role ?? null }))
    );
    check(
      'socialMediaAuthorIds',
      variables.socialMediaAuthorIds,
      draft.socialMediaAuthors.map(a => a.id)
    );
    for (const field of [
      'preTitle',
      'title',
      'lead',
      'seoTitle',
      'socialMediaTitle',
      'socialMediaDescription',
    ] as const) {
      check(field, variables[field] ?? null, draft[field] ?? null);
    }
    check('imageID', variables.imageID, draft.image?.id ?? null);
    check(
      'socialMediaImageID',
      variables.socialMediaImageID,
      draft.socialMediaImage?.id ?? null
    );
    if (mismatches.length) {
      throw new Error(
        `${variables.slug}: verification failed for ${mismatches.join(', ')} – new draft revision ${draft.id} differs from what was sent. ` +
          `Inspect the article in the editor (version history) before continuing.`
      );
    }
    return draft.id;
  }

  private async publishArticle(id: string, publishedAt: string) {
    await this.client.request(PUBLISH_ARTICLE_MUTATION, { id, publishedAt });
  }

  async migrateArticles(limit: number, only?: string) {
    const authorMap = this.resolveAuthorMap();
    const queue = this.plan.articles.filter(
      a => !only || a.id === only || a.slug === only
    );
    log(
      `\n▸ Migrating ${Math.min(limit, queue.length)} of ${queue.length} article(s)${this.dryRun ? ' (dry run)' : ''}`
    );

    let processed = 0;
    for (const planned of queue) {
      if (processed >= limit) break;
      if (this.actionLog.done('article', planned.id)) continue;
      processed++;

      const article = await this.fetchArticle(planned.id);
      if (article.peer) {
        log(`  – ${article.slug}: peered, skipped`);
        continue;
      }
      if (article.pending) {
        log(`  – ${article.slug}: has pending revision, skipped`);
        continue;
      }

      const published =
        article.published ?
          this.buildUpdateVariables(article, article.published, authorMap)
        : null;
      const draft =
        article.draft ?
          this.buildUpdateVariables(article, article.draft, authorMap)
        : null;

      if (!published?.changed && !draft?.changed) {
        log(`  = ${article.slug}: nothing to change`);
        this.actionLog.write({
          type: 'article',
          id: article.id,
          status: 'done',
          details: 'unchanged',
        });
        continue;
      }

      const describe = (v: NonNullable<typeof published>) =>
        v.input.authors.map(a => describeAuthor(this.plan, a)).join(' | ');

      const steps: string[] = [];
      if (published?.changed) steps.push(`published → ${describe(published)}`);
      if (draft && (published?.changed || draft.changed))
        steps.push(`draft → ${describe(draft)}`);
      log(`  ✎ ${article.slug}: ${steps.join('; ')}`);
      if (this.dryRun) continue;

      const details: Record<string, unknown> = {};
      if (published?.changed) {
        // 1. re-create the published revision with migrated authors and publish it at the original date
        const revisionId = await this.updateArticle(published.input);
        await this.publishArticle(article.id, article.published!.publishedAt!);
        const after = await this.fetchArticle(article.id);
        if (after.published?.id !== revisionId) {
          throw new Error(
            `${article.slug}: publish did not activate revision ${revisionId}`
          );
        }
        details.published = { from: article.published!.id, to: revisionId };
      }
      if (draft && (published?.changed || draft.changed)) {
        // 2. re-create the (now archived) draft on top, so editors keep their unpublished work
        const revisionId = await this.updateArticle(draft.input);
        details.draft = { from: article.draft!.id, to: revisionId };
      }
      this.actionLog.write({
        type: 'article',
        id: article.id,
        status: 'done',
        details,
      });
    }
  }

  // ---- cleanup ----------------------------------------------------------------

  async deleteMergedAuthors() {
    log(
      `\n▸ Deleting ${this.plan.authorsToDelete.length} merged author(s)${this.dryRun ? ' (dry run)' : ''}`
    );
    const articles = await fetchAllArticlesLight(this.client, 'new');
    const pendingIds = articles.filter(a => a.pending).map(a => a.id);
    const referenced = new Map<string, string[]>();
    for (const article of articles) {
      for (const rev of [article.published, article.draft]) {
        if (!rev) continue;
        for (const id of [
          ...rev.authors.map(a => a.authorId),
          ...rev.socialMediaAuthorIds,
        ]) {
          const list = referenced.get(id) ?? [];
          if (!list.includes(article.slug)) list.push(article.slug);
          referenced.set(id, list);
        }
      }
    }
    if (pendingIds.length) {
      warn(
        `${pendingIds.length} article(s) have pending revisions whose authors cannot be checked here: ${pendingIds.join(', ')}`
      );
    }

    for (const author of this.plan.authorsToDelete) {
      if (this.actionLog.done('author-delete', author.id)) continue;
      const refs = referenced.get(author.id);
      if (refs?.length) {
        warn(
          `keeping "${author.name}" (${author.slug}) – still used by ${refs.length} article(s): ${refs.slice(0, 5).join(', ')}${refs.length > 5 ? ', …' : ''}`
        );
        continue;
      }
      log(`  ✕ "${author.name}" (${author.slug})`);
      if (this.dryRun) continue;
      await this.client.request(DELETE_AUTHOR_MUTATION, { id: author.id });
      this.actionLog.write({
        type: 'author-delete',
        id: author.id,
        status: 'done',
        details: author,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const apiUrl =
    (flags.api as string) || process.env.WEPUBLISH_API_URL || DEFAULT_API_URL;
  const client = new Client(apiUrl);
  await client.authenticate();
  log(
    `API: ${apiUrl} (${client.authenticated ? 'authenticated' : 'anonymous'})`
  );

  if (command === 'analyze') {
    if (!client.authenticated) {
      warn(
        'Not authenticated – drafts and unpublished articles are NOT included. Set WEPUBLISH_TOKEN or WEPUBLISH_EMAIL/WEPUBLISH_PASSWORD.'
      );
    }
    const shape = await detectAuthorShape(client);
    log(
      `API author shape: ${shape === 'new' ? 'new (roles supported)' : 'old (roles not deployed yet – analysis only)'}`
    );
    log('Fetching authors …');
    const authors = await fetchAllAuthors(client);
    log(`  ${authors.length} authors`);
    log('Fetching articles …');
    const articles = await fetchAllArticlesLight(client, shape);
    const plan = buildPlan(apiUrl, client, authors, articles);
    printReport(plan);
    const out = (flags.out as string) || 'author-migration-plan.json';
    const htmlOut = (flags.html as string) || out.replace(/\.json$/, '') + '.html';
    fs.writeFileSync(out, JSON.stringify(plan, null, 2));
    fs.writeFileSync(htmlOut, renderHtmlReport(plan));
    log(`Plan (JSON) written to ${out}`);
    log(`Report (HTML) written to ${htmlOut}`);
    log(
      `Review them, then run: npx tsx ${path.relative(process.cwd(), __filename)} apply --plan ${out} --dry-run`
    );
    return;
  }

  if (command === 'apply' || command === 'cleanup') {
    const planFile = flags.plan as string;
    if (!planFile) throw new Error('--plan <file> is required');
    if (!client.authenticated)
      throw new Error(
        'apply/cleanup require WEPUBLISH_TOKEN or WEPUBLISH_EMAIL/WEPUBLISH_PASSWORD'
      );
    const plan: Plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    if (plan.apiUrl !== apiUrl)
      throw new Error(
        `Plan was generated for ${plan.apiUrl}, but API is ${apiUrl}`
      );
    if (!plan.includesDrafts)
      warn(
        'Plan was generated anonymously – drafts were not analyzed. Re-run analyze with credentials.'
      );
    if ((await detectAuthorShape(client)) !== 'new') {
      throw new Error(
        'The API does not expose article author roles yet – deploy the API change first.'
      );
    }

    const schemaPath =
      (flags.schema as string) ||
      path.resolve(__dirname, '../../../apps/api-example/schema-v2.graphql');
    const mapper = new SchemaMapper(parse(fs.readFileSync(schemaPath, 'utf8')));
    const dryRun = !!flags['dry-run'];
    const actionLog = new ActionLog(
      planFile.replace(/\.json$/, '') + '.log.jsonl'
    );
    const migrator = new Migrator(client, mapper, plan, actionLog, dryRun);

    if (command === 'apply') {
      await migrator.createMissingAuthors();
      await migrator.fixCanonicalAuthors();
      await migrator.migrateArticles(
        flags.limit ? Number(flags.limit) : Infinity,
        flags.only as string | undefined
      );
      log(
        `\nDone${dryRun ? ' (dry run – nothing written)' : ''}. Progress is logged in ${actionLog['file']}; re-running skips finished items.`
      );
      if (!dryRun)
        log(
          'When all articles are migrated, run `cleanup` to delete the merged authors.'
        );
    } else {
      await migrator.deleteMergedAuthors();
    }
    return;
  }

  throw new Error(
    `Unknown command "${command}". Use analyze | apply | cleanup.`
  );
}

export {
  Client,
  SchemaMapper,
  parseAuthorName,
  buildPlan,
  fetchAllAuthors,
  fetchAllArticlesLight,
  detectAuthorShape,
};

if (require.main === module) {
  main().catch(error => {
    console.error('\n✖', error instanceof Error ? error.message : error);
    if (error instanceof GraphQLError)
      console.error(JSON.stringify(error.errors, null, 2));
    process.exit(1);
  });
}
