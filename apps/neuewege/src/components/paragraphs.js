// Content renderers of the live site, ported from its bundle (functions Uo,
// Go, Wo, Ho, Zo, Xo, Bo, _i, Ii, wi, yi, gi).
import { useQuery } from '@apollo/client';
import React from 'react';

import { rewriteLegacyLinks } from '../lib/links';
import { AgendaQuery } from '../lib/queries';
import * as S from '../lib/styles';
import { SUBSCRIBE_REF } from '../lib/wepublish/subscribe-ref';
import { ResponsiveImage, VisibilityObserver } from './primitives';
import { SubscribeForm } from './subscribe-form';
import { Webform } from './webform';

// bundle function `_i`
function Downloads({ downloads }) {
  return (
    <div className={S.downloads.root}>
      {downloads &&
        downloads.map(({ download }) => (
          <div
            className={S.downloads.link}
            key={download.uuid}
          >
            <a
              href={download.fieldMediaFile.entity.url}
              target="_blank"
            >
              {download.name}
            </a>
          </div>
        ))}
    </div>
  );
}

// bundle function `Ii`
function Footnotes({ footnotesArray }) {
  return (
    <div className={S.footnotes.root}>
      <ol id="footnotes">
        {footnotesArray.map(({ footnote }) => (
          <li
            key={footnote.uuid}
            dangerouslySetInnerHTML={{
              __html: rewriteLegacyLinks(
                footnote.text && footnote.text.processed
              ),
            }}
          />
        ))}
      </ol>
    </div>
  );
}

// bundle function `wi`
function DonorBox() {
  return (
    <section style={{ textAlign: 'left' }}>
      {/* the live markup of the embed; React does not execute this script */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        src="https://donorbox.org/widget.js"
        type="text/javascript"
        paypalexpress="false"
      />
      <iframe
        src="https://donorbox.org/embed/neue-wege"
        height={1000}
        width="100%"
        style={{
          maxWidth: 500,
          minWidth: 310,
          maxHeight: 'none !important',
          border: 0,
        }}
        seamless
        name="donorbox"
        scrolling="yes"
        allowpaymentrequest="true"
      />
    </section>
  );
}

// bundle function `yi`
function AgendaEvent({ title, paragraphs }) {
  return (
    <li className={S.agenda.event}>
      <h2 className="title">{title}</h2>
      <Paragraphs paragraphs={paragraphs} />
    </li>
  );
}

// bundle function `gi`
export function Agenda({ singleEvent }) {
  const { loading, data } = useQuery(AgendaQuery, {
    variables: { offset: 0, limit: 1000 },
  });

  if (loading) {
    return <span>Agenda wird geladen...</span>;
  }

  return (
    <div className={S.agenda.root}>
      <ul className={S.agenda.events}>
        {(singleEvent && <AgendaEvent {...singleEvent} />) ||
          (data.agenda &&
            data.agenda.events.map(event => (
              <AgendaEvent
                key={event.key}
                {...event}
              />
            )))}
      </ul>
    </div>
  );
}

// bundle function `Uo`: one renderer per Drupal paragraph type
const RENDERERS = {
  ParagraphTitle: ({ paragraph }) => (
    <h3
      className="paragraph--h3 h3"
      key={paragraph.key}
    >
      {paragraph.subtitle}
    </h3>
  ),
  ParagraphText: ({ paragraph }) => (
    <div
      className="paragraph--p p"
      key={paragraph.key}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: rewriteLegacyLinks(
            paragraph.text && paragraph.text.processed
          ),
        }}
      />
    </div>
  ),
  ParagraphQuote: ({ paragraph }) => (
    <div
      className="paragraph--quote quote"
      key={paragraph.key}
    >
      <VisibilityObserver>{paragraph.quote}</VisibilityObserver>
    </div>
  ),
  ParagraphFootnotes: ({ paragraph }) => (
    <Footnotes
      key={paragraph.key}
      {...paragraph}
    />
  ),
  ParagraphImages: ({ paragraph }) =>
    paragraph.imagesArray.map(({ entity }) => (
      <ResponsiveImage
        key={entity.uuid}
        {...entity}
      />
    )),
  ParagraphInterviewQuestion: ({ paragraph }) => (
    <section
      className="paragraph--question question"
      key={paragraph.key}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: rewriteLegacyLinks(paragraph.text.processed),
        }}
      />
    </section>
  ),
  ParagraphInfo: ({ paragraph }) => (
    <section
      className="paragraph--info info"
      key={paragraph.key}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: rewriteLegacyLinks(paragraph.text.processed),
        }}
      />
    </section>
  ),
  Paragraph2Column: ({ paragraph }) => (
    <section
      className={`${S.paragraphs.twoColumn} twoColumn`}
      key={paragraph.key}
    >
      <div className={S.paragraphs.oneOfTwoColumn}>
        {paragraph.firstColumn.map(renderParagraph)}
      </div>
      <div className={S.paragraphs.twoOfTwoColumn}>
        {paragraph.secondColumn.map(renderParagraph)}
      </div>
    </section>
  ),
  ParagraphDonorBox: ({ paragraph }) => <DonorBox key={paragraph.key} />,
  // a we.publish SubscribeBlock (the /abos form) or a Drupal webform
  ParagraphWebform: ({ paragraph }) =>
    paragraph.fieldWebform.id.startsWith(SUBSCRIBE_REF) ?
      <SubscribeForm
        key={paragraph.key}
        subscribeRef={paragraph.fieldWebform.id}
      />
    : <Webform
        key={paragraph.key}
        {...paragraph}
      />,
  ParagraphDownloads: ({ paragraph }) => (
    <Downloads
      key={paragraph.key}
      {...paragraph}
    />
  ),
  ParagraphAgenda: ({ paragraph }) => <Agenda key={paragraph.key} />,
};

function renderParagraph(entry) {
  const render = RENDERERS[entry.paragraph.__typename];

  return render ? render(entry) : null;
}

// bundle functions `Zo`/`Xo`: clicking a footnote marker scrolls to the list
export function Paragraphs({ paragraphs, pageType }) {
  const node = React.useRef(null);

  React.useEffect(() => {
    const markers = Array.from(node.current?.getElementsByTagName('sup') ?? []);
    const scrollToFootnotes = () =>
      document.getElementById('footnotes')?.scrollIntoView();

    markers.forEach(sup => sup.addEventListener('click', scrollToFootnotes));

    return () =>
      markers.forEach(sup =>
        sup.removeEventListener('click', scrollToFootnotes)
      );
  }, [paragraphs]);

  return (
    <div ref={node}>
      <div className={`${S.paragraphs.root} paragraphs--root`}>
        <div className={`${S.paragraphs.paragraphs} ${pageType}`}>
          {(paragraphs || []).map(renderParagraph)}
        </div>
      </div>
    </div>
  );
}
