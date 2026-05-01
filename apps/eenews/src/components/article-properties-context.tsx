import { createContext, useContext } from 'react';

/**
 * Article-level properties context (MP-6).
 *
 * Wepublish articles expose `properties` as `Array<{ key, value, public }>`. This provider
 * surfaces that array to deeply-nested components without prop drilling.
 *
 * Initial keys for EE News (per `eenews-system-design.md` Section 4):
 *   - `readTimeMin` — used by featured teaser ("6 Min. Lesezeit") and article hero
 *   - `topic` — slug into a topic dictionary (resolved from first matching tag)
 *
 * Region (CH/Welt) is route-driven, not article-property-driven (Q19 resolved).
 */
type ArticleProperty = {
  key: string;
  value: string;
  public?: boolean;
};

export const ArticlePropertiesContext = createContext<ArticleProperty[]>([]);

export const useArticleProperty = (key: string): string | undefined => {
  const properties = useContext(ArticlePropertiesContext);
  return properties.find(p => p.key === key)?.value;
};
