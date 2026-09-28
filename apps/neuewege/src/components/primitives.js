// Small building blocks of the live site, ported from its bundle
// (fd73.webcrack.js). Markup and class names must stay identical to the
// live DOM - the stylesheet in styles/live-modules.css depends on them.
import Router, { useRouter } from 'next/router';
import React from 'react';

import { iconSrc } from '../lib/icons';
import { externalTarget, localPath } from '../lib/links';
import * as S from '../lib/styles';

// bundle function `re`: builds "/<slug>?search=<search>" from the current
// route, overridable per key
function useLinkHref(query = {}) {
  const router = useRouter();
  const has = key => Object.prototype.hasOwnProperty.call(query, key);
  const search = has('search') ? query.search : router.query.search;
  const slug = has('slug') ? query.slug : router.query.slug;
  const params = search ? `?search=${encodeURIComponent(search)}` : '';

  return `${localPath(slug)}${params}`;
}

// bundle function `ie`: next/link (shallow) around <span><a/></span>
export function ShallowLink({ query, onClick, ...rest }) {
  const internalHref = useLinkHref(query);
  const external = externalTarget(internalHref);
  const href = external || internalHref;

  return (
    <span
      onClick={event => {
        if (
          external ||
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        Router.push(href, undefined, { shallow: true });
      }}
    >
      <a
        onClick={event => (onClick ? onClick(event) : null)}
        href={href}
        {...rest}
      />
    </span>
  );
}

// bundle class `V` (@researchgate/react-intersection-observer): observes its
// single child and calls onChange(entry)
export function IntersectionObserver({ onChange, children }) {
  const ref = React.useRef(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    const node = ref.current;

    if (!node) {
      return undefined;
    }

    const observer = new window.IntersectionObserver(entries => {
      entries.forEach(entry => onChangeRef.current(entry));
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return React.cloneElement(React.Children.only(children), { ref });
}

// bundle function `$i`
export function IconButton({ type, desktopText }) {
  return (
    <div className={S.iconButton.root}>
      <div
        className={`${S.iconButton.icon} ${desktopText ? 'text-icon' : 'icon-only'}`}
      >
        <img
          className={S.iconButton.img}
          src={iconSrc(type)}
          alt={type}
        />
      </div>
      {desktopText && <div className={S.iconButton.text}>{desktopText}</div>}
    </div>
  );
}

// bundle function `Le`
export function DateComponent({ value }) {
  return (
    <span>
      {new Date(Date.parse(value)).toLocaleDateString('de-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </span>
  );
}

function srcSet(styles) {
  return styles.map(({ width, url }) => `${url} ${width}w`).join(', ');
}

function Picture({ image }) {
  const { alt, style_s, style_m, style_l, style_xl, style_xxl, style_xxxl } =
    image;
  const styles = [style_s, style_m, style_l, style_xl, style_xxl, style_xxxl];

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        paddingBottom: `${(100 / style_xxxl.width) * style_xxxl.height}%`,
      }}
    >
      <img
        srcSet={srcSet(styles)}
        src={style_s.url}
        sizes="100vw"
        alt={alt}
        style={{ width: '100%', position: 'absolute' }}
      />
    </div>
  );
}

// bundle function `Qe`
export function ResponsiveImage({ image, caption, noCaption }) {
  return (
    <div className="Image--root">
      {(noCaption && <Picture image={image} />) || (
        <figure>
          <Picture image={image} />
          <figcaption
            className={S.image.figcaption}
            dangerouslySetInnerHTML={{ __html: caption && caption.processed }}
          />
        </figure>
      )}
    </div>
  );
}

// bundle class `Fi`
export function VisibilityObserver({ children }) {
  const [visibility, setVisibility] = React.useState('hidden');

  return (
    <IntersectionObserver
      onChange={entry =>
        setVisibility(entry.isIntersecting ? 'visible' : 'invisible')
      }
    >
      <div
        className={`${S.visibilityObserver.VisibilityObserver} ${visibility}`}
      >
        <div className={S.visibilityObserver.inner}>{children}</div>
      </div>
    </IntersectionObserver>
  );
}
