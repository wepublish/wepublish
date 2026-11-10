/**
 * A medium's newsletter kit: its theme, the blocks its issues may hold, and the
 * Einzug options its editor offers.
 *
 * Every document names its kit (`NewsletterDocument.kit`), so whatever renders
 * or validates one — the API, the Puck canvas, `imagesIn` — knows the design
 * without being told which medium it runs for. The API picks the kit when an
 * issue is created (`NEWSLETTER_KIT`) and never lets an edit change it.
 *
 * The blocks themselves are shared: a kit is a selection of them plus the theme
 * they are drawn in, handed down through `NewsletterKitProvider`. There is no
 * default kit in that context on purpose — a block drawn outside one throws
 * rather than quietly coming out in eenews blue.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Gutter, NewsletterBlock } from './blocks';
import { bajourKit } from './kits/bajour';
import { eenewsKit } from './kits/eenews';
import type { NewsletterTheme } from './theme';

export const KIT_IDS = ['eenews', 'bajour'] as const;

export type KitId = (typeof KIT_IDS)[number];

export type BlockType = NewsletterBlock['type'];

export interface NewsletterKit {
  id: KitId;
  theme: NewsletterTheme;
  /** The block types this kit's issues may hold, in the order the editor lists them. */
  blocks: readonly BlockType[];
  /** The Einzug options the editor offers. */
  gutters: readonly Gutter[];
  /** The Einzug a block gets when the document names none. */
  defaultGutter: Record<BlockType, Gutter>;
}

/**
 * What a document written before kits existed is in: they were all eenews
 * issues, and they must keep rendering exactly as they did.
 */
export const LEGACY_KIT_ID: KitId = 'eenews';

const KITS: Record<KitId, NewsletterKit> = {
  eenews: eenewsKit,
  bajour: bajourKit,
};

export const isKitId = (value: unknown): value is KitId =>
  typeof value === 'string' && (KIT_IDS as readonly string[]).includes(value);

export const getKit = (id: KitId): NewsletterKit => KITS[id];

const KitContext = createContext<NewsletterKit | null>(null);

export function NewsletterKitProvider({
  kit,
  children,
}: {
  kit: NewsletterKit;
  children: ReactNode;
}) {
  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

export function useNewsletterKit(): NewsletterKit {
  const kit = useContext(KitContext);

  if (!kit) {
    throw new Error(
      'A newsletter block was drawn outside a NewsletterKitProvider, so there is no theme to draw it in.'
    );
  }

  return kit;
}

export const useNewsletterTheme = (): NewsletterTheme =>
  useNewsletterKit().theme;
