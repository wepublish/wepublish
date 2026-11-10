/**
 * The shape of a newsletter's design tokens.
 *
 * Each medium's kit (`kits/`) fills one in, read off a sent issue of its own
 * rather than invented. A theme is the only place a colour, font or measurement
 * may be written down: a value inlined in a block is a value nobody will find
 * again when the design changes — which is the whole reason the design moved out
 * of Mailchimp.
 *
 * The top-level groups are shared by every block; the per-block groups at the
 * bottom (`heading` … `footer`) are where two media differ by more than a
 * colour — a centred button, a heavier rule, a legal notice on its own grey.
 * A token one kit has no use for (eenews's single font, bajour's big-teaser
 * frame) still gets a value, so no block has to ask which kit it is in.
 */
export interface NewsletterTheme {
  font: {
    /** Body text, headings and the footer masthead. */
    body: string;
    /** Small print: captions, buttons, the date line, the legal notice. */
    ui: string;
  };
  color: {
    /** Behind the column. */
    page: string;
    /** The column itself. */
    body: string;
    text: string;
    /** The accent: kickers, teaser headlines. */
    brand: string;
    /** Rubric bars and the frame around big-teaser images. */
    tint: string;
    /** Behind the highlight panel. */
    highlight: string;
    /** Links in prose. */
    link: string;
    rule: string;
  };
  size: {
    body: string;
    /** Rubric bars, teaser headlines, panel titles. */
    heading: string;
  };
  lineHeight: {
    body: string;
    heading: string;
  };
  space: {
    /** The `article` Einzug: the standard block inset. */
    gutter: string;
    /** The `intro` Einzug. */
    introGutter: string;
    /** The `none` Einzug — edge to edge. */
    noGutter: string;
    tight: string;
    /** Above and below every block. */
    block: string;
    /** Between two paragraphs, and above a list. */
    paragraph: string;
    section: string;
  };
  bigTeaser: {
    imageWidth: number;
    frameWidth: number;
    imageColumnPercent: string;
    textColumnPercent: string;
  };
  /** The column width, in pixels. */
  contentWidth: number;
  /** Columns stack below this width. */
  mobileBreakpoint: number;

  /** The `heading` block. */
  heading: { fontSize: string; color: string };
  /** The line under an image block. */
  caption: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    color: string;
    fontStyle?: 'italic';
    textAlign?: 'center';
  };
  button: {
    background: string;
    color: string;
    fontFamily: string;
    fontSize: string;
    padding: string;
    radius: string;
    /** Absent: the button sits at the left edge of the column. */
    align?: 'center';
  };
  divider: {
    width: string;
    color: string;
    /** Above and below the line. */
    space: string;
  };
  /** The date line at the top of an issue. */
  meta: {
    fontFamily: string;
    fontSize: string;
    color: string;
    background?: string;
  };
  /** The pinned closing block. */
  footer: {
    background: string;
    titleSize: string;
    titleColor: string;
    /** A background behind the title's text alone, as a highlighter would. */
    titleHighlight?: string;
    /** Prose lines under the title. */
    color: string;
    textSize: string;
    linkColor: string;
    /** Absent: title and lines start at the left edge of the column. */
    align?: 'center';
    legal: {
      fontFamily: string;
      fontSize: string;
      color: string;
      linkColor: string;
      /**
       * Set: the legal notice gets a band of its own in this colour under the
       * closing block. Absent: it sits inside the closing block.
       */
      background?: string;
    };
  };
}
