import {
  ComponentType,
  PropsWithChildren,
  ReactNode,
  ScriptHTMLAttributes,
} from 'react';

/**
 * Replacement for `next/head`.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` no matter
 * where they are rendered, so the shim is a pass-through. Two caveats that bit
 * us and that you must respect when adding routes:
 *
 *  1. **React does not deduplicate `<title>`.** `next/head` merged by `key`
 *     and the *last* one won. React keeps all of them and the browser uses the
 *     *first* in document order. Therefore the shell must never render a
 *     default `<title>` — set the title either through the route's `head()`
 *     (for routes without an SEO component) or let `PageSEO`/`ArticleSEO`/
 *     `EventSEO`/`TagSEO` render it, never both.
 *  2. The `key` props that the SEO components still pass are inert here. They
 *     are harmless, so they were left in place to avoid touching `libs/`.
 */
export const Head: ComponentType<{ children: ReactNode }> = ({ children }) => (
  // eslint-disable-next-line react/jsx-no-useless-fragment
  <>{children}</>
);

type ScriptProps = PropsWithChildren<
  ScriptHTMLAttributes<HTMLScriptElement> & {
    /** `next/script` prop, ignored — React decides placement. */
    strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
  }
>;

/**
 * Replacement for `next/script`. Inline children become
 * `dangerouslySetInnerHTML` because React refuses to render children into a
 * `<script>` element. `strategy` is dropped: React 19 hoists `<script async>`
 * and renders everything else in place.
 */
export const Script = ({
  children,
  strategy: _strategy,
  ...props
}: ScriptProps) => {
  if (children != null) {
    return (
      <script
        {...props}
        dangerouslySetInnerHTML={{ __html: String(children) }}
      />
    );
  }

  return <script {...props} />;
};
