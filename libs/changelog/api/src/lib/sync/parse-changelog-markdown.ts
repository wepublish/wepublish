import { readFileSync, statSync } from 'fs';
import path from 'path';

export type ParsedChangelogMarkdown = {
  title: string;
  lead: string;
  actionRequired: boolean;
  description: string | null;
};

const KNOWN_FRONTMATTER_KEYS = ['title', 'lead', 'actionRequired'];

const FRONTMATTER_DELIMITER = /^---\s*$/;

const stripQuotes = (value: string): string => {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

// The parser intentionally supports only a flat `key: value` frontmatter so the
// sync can run in the migration container without any YAML/markdown dependency.
export function parseChangelogMarkdown(
  markdown: string
): ParsedChangelogMarkdown {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  if (!lines.length || !FRONTMATTER_DELIMITER.test(lines[0])) {
    throw new Error(
      `Changelog file has to start with a "---" frontmatter block containing ${KNOWN_FRONTMATTER_KEYS.join(', ')}`
    );
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && FRONTMATTER_DELIMITER.test(line)
  );

  if (closingIndex === -1) {
    throw new Error('Changelog frontmatter is never closed with "---"');
  }

  const frontmatter: Record<string, string> = {};

  for (const line of lines.slice(1, closingIndex)) {
    if (!line.trim()) {
      continue;
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);

    if (!match) {
      throw new Error(`Invalid changelog frontmatter line: "${line}"`);
    }

    const [, key, rawValue] = match;

    if (!KNOWN_FRONTMATTER_KEYS.includes(key)) {
      throw new Error(
        `Unknown changelog frontmatter key "${key}". Allowed keys: ${KNOWN_FRONTMATTER_KEYS.join(', ')}`
      );
    }

    if (key in frontmatter) {
      throw new Error(`Duplicate changelog frontmatter key "${key}"`);
    }

    frontmatter[key] = stripQuotes(rawValue.trim());
  }

  const title = frontmatter['title'];
  const lead = frontmatter['lead'];

  if (!title) {
    throw new Error('Changelog frontmatter is missing a non-empty "title"');
  }

  if (!lead) {
    throw new Error('Changelog frontmatter is missing a non-empty "lead"');
  }

  let actionRequired = false;

  if ('actionRequired' in frontmatter) {
    if (!['true', 'false'].includes(frontmatter['actionRequired'])) {
      throw new Error(
        `Changelog frontmatter key "actionRequired" has to be "true" or "false", got "${frontmatter['actionRequired']}"`
      );
    }

    actionRequired = frontmatter['actionRequired'] === 'true';
  }

  const description = lines
    .slice(closingIndex + 1)
    .join('\n')
    .trim();

  return {
    title,
    lead,
    actionRequired,
    description: description || null,
  };
}

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const MARKDOWN_IMAGE = /(!\[[^\]]*\]\()([^)\s]+)(\))/g;

const isLocalImageUrl = (url: string): boolean =>
  !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/');

// Local images are inlined as data URIs at sync time so the running API never
// needs access to the changelog files on disk.
export function inlineChangelogImages(
  markdown: string,
  directory: string
): string {
  const root = path.resolve(directory);

  return markdown.replace(MARKDOWN_IMAGE, (match, prefix, url, suffix) => {
    if (!isLocalImageUrl(url)) {
      return match;
    }

    let decodedUrl = url;

    try {
      decodedUrl = decodeURIComponent(url);
    } catch {
      // leave percent signs that are not valid escapes untouched
    }

    const imagePath = path.resolve(root, decodedUrl);

    if (imagePath !== root && !imagePath.startsWith(root + path.sep)) {
      throw new Error(
        `Changelog image "${url}" points outside of the changelog folder`
      );
    }

    const extension = path.extname(imagePath).toLowerCase();
    const mimeType = IMAGE_MIME_TYPES[extension];

    if (!mimeType) {
      throw new Error(
        `Changelog image "${url}" has an unsupported type. Supported: ${Object.keys(IMAGE_MIME_TYPES).join(', ')}`
      );
    }

    let stats;

    try {
      stats = statSync(imagePath);
    } catch {
      throw new Error(`Changelog image "${url}" does not exist`);
    }

    if (!stats.isFile()) {
      throw new Error(`Changelog image "${url}" is not a file`);
    }

    const content = readFileSync(imagePath);

    return `${prefix}data:${mimeType};base64,${content.toString('base64')}${suffix}`;
  });
}
