import styled from '@emotion/styled';

/**
 * The editor page's own styles, scoped to it. Puck's stylesheet is imported
 * first, so anything here wins over it. Puck lays itself out against the
 * viewport, so the wrapper must not clip it.
 */
export const EditorStyles = styled.div`
  height: 100vh;
  font:
    16px/1.5 system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;

  .editor-status {
    padding: 24px;
    color: #5c6870;
  }

  .editor-status[data-kind='error'] {
    color: #a11;
  }

  .editor-link {
    align-self: center;
    margin-right: 12px;
    font-size: 14px;
    color: #195a7d;
    text-decoration: none;
    white-space: nowrap;
  }

  .editor-link:hover {
    text-decoration: underline;
  }

  /* Prose field: toolbar above a contenteditable that shows the formatting rather
     than the markup. The field's own markup is what is stored — see
     prose-field.tsx. */
  .prose-toolbar {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .prose-toolbar button {
    font: inherit;
    font-size: 13px;
    line-height: 1;
    padding: 6px 10px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
    background: #fff;
    color: #195a7d;
    cursor: pointer;
  }

  .prose-toolbar button:hover {
    border-color: #195a7d;
  }

  /* The toolbar reports what the caret sits in, so a button is a state and not
     only an action — otherwise the only way to tell bold from not is to look. */
  .prose-toolbar button[data-active='true'] {
    border-color: #195a7d;
    background: #eaf2f7;
  }

  .prose-link {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .prose-link-url {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: 13px;
    padding: 6px 8px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
  }

  .prose-link button {
    font: inherit;
    font-size: 13px;
    line-height: 1;
    padding: 6px 10px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
    background: #fff;
    color: #195a7d;
    cursor: pointer;
    white-space: nowrap;
  }

  /* The merge-tag picker. A panel above the editable rather than a floating
     overlay: this renders inside Puck's sidebar, which scrolls and clips, so
     anything positioned out of the flow is cut off by an ancestor's overflow. */
  .prose-tags {
    margin-bottom: 4px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
    background: #fff;
  }

  .prose-tags-search {
    display: block;
    width: 100%;
    font: inherit;
    font-size: 13px;
    padding: 6px 8px;
    border: 0;
    border-bottom: 1px solid #d9e2dd;
    border-radius: 4px 4px 0 0;
  }

  .prose-tags-note {
    margin: 0;
    padding: 6px 8px;
    font-size: 12px;
    color: #5c6870;
  }

  /* Capped and scrollable: the list runs to twenty-odd system tags plus the
     audience's own fields, and an uncapped panel pushes the editable itself out
     of the sidebar's viewport. */
  .prose-tags-list {
    max-height: 240px;
    overflow-y: auto;
  }

  .prose-tags-group {
    position: sticky;
    top: 0;
    margin: 0;
    padding: 4px 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5c6870;
    background: #f4f7f6;
  }

  .prose-tags-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    font: inherit;
    font-size: 13px;
    text-align: left;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: #0e1116;
    cursor: pointer;
  }

  .prose-tags-item:hover {
    background: #eaf2f7;
  }

  .prose-tags-item code {
    font-size: 11px;
    color: #195a7d;
    white-space: nowrap;
  }

  .prose-editor {
    display: block;
    width: 100%;
    min-height: 140px;
    max-height: 420px;
    overflow-y: auto;
    font: inherit;
    font-size: 14px;
    line-height: 1.5;
    padding: 8px 10px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
    background: #fff;
    color: #0e1116;
  }

  .prose-editor:focus {
    outline: 2px solid #195a7d;
    outline-offset: -1px;
  }

  /* Paragraph spacing that matches the newsletter's rather than the browser's
     1em, so the field reads like the block it is editing. */
  .prose-editor p {
    margin: 0 0 8px;
  }

  .prose-editor p:last-child {
    margin-bottom: 0;
  }

  .prose-editor ul {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  .prose-editor a {
    color: #195a7d;
    text-decoration: underline;
  }

  .prose-hint {
    margin: 4px 0 0;
    font-size: 12px;
    color: #5c6870;
  }

  /* The dynamic-content row from condition-field.tsx: merge field, comparison and
     value, in Mailchimp's own order. */
  .condition-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  /* The three boxes share one line when the sidebar allows it and wrap when it
     does not: the merge field's name is the long part, so it takes the whole first
     line and leaves the comparison beside the value. */
  .condition-tag {
    flex: 1 1 100%;
    min-width: 0;
  }

  .condition-operator {
    flex: 0 0 auto;
  }

  .condition-value {
    flex: 1 1 80px;
    min-width: 0;
  }

  .condition-field select,
  .condition-field input {
    font: inherit;
    font-size: 13px;
    padding: 6px 8px;
    border: 1px solid #d9e2dd;
    border-radius: 4px;
    background: #fff;
    color: #0e1116;
  }

  /* A condition with no merge field is no condition at all, so its comparison and
     value are disabled rather than hidden — a row that changes shape as it is
     filled in is harder to read than one that greys out. */
  .condition-field select:disabled,
  .condition-field input:disabled {
    background: #f4f7f6;
    color: #5c6870;
  }

  .condition-preview {
    margin: 4px 0 0;
    font-size: 11px;
    line-height: 1.5;
    color: #195a7d;
    overflow-wrap: anywhere;
  }

  .condition-note {
    margin: 4px 0 0;
    font-size: 12px;
    color: #5c6870;
  }

  /* Chosen but empty ships nothing, which is the opposite of what the editor was
     setting up — so that one note is coloured like a warning. */
  .condition-warn {
    color: #a11;
  }

  /* The canvas shows the email's own markup, so give it the page's cream backdrop
     rather than Puck's default white — otherwise the 660px column is invisible. */
  .Puck-frame,
  iframe[title='Puck'] {
    background: #f8f5ee;
  }

  /* The header's state slot, left of the two actions: either the save/transfer
     hint — the only signal that an issue is finished here but not yet in Mailchimp,
     so it is not muted away — or, while one is running, what the last action did.
     Server rejections land here too and can be a whole sentence, so the slot is
     capped and ellipsised instead of pushing the buttons out of the header; the
     full text stays available as the element's 'title'. */
  .editor-state {
    align-self: center;
    margin-right: 12px;
    font-size: 13px;
    color: #5c6870;
    white-space: nowrap;
    max-width: 42ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .editor-state[data-kind='stale'] {
    color: #8a5300;
  }

  .editor-state[data-kind='error'] {
    color: #a12b2b;
  }

  /* Secondary action: save without touching Mailchimp. */
  .editor-save {
    font: inherit;
    font-size: 14px;
    line-height: 1;
    margin-right: 8px;
    padding: 10px 16px;
    border: 1px solid #195a7d;
    border-radius: 6px;
    background: #fff;
    color: #195a7d;
    cursor: pointer;
    white-space: nowrap;
  }

  .editor-save:hover:not(:disabled) {
    background: #f0faff;
  }

  .editor-save:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  /* The header's primary action: transfer the stored issue to Mailchimp. */
  .editor-publish {
    font: inherit;
    font-size: 14px;
    line-height: 1;
    padding: 10px 16px;
    border: 1px solid #195a7d;
    border-radius: 6px;
    background: #195a7d;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
  }

  .editor-publish:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  /* The «Prüfung» plugin in the left sidebar — see report.tsx. In normal flow
     inside a column that already scrolls, so there is no fixed positioning and
     no arithmetic against Puck's own layout height. The heading's negative
     margins let its rule span the panel's full width. */
  .report-panel {
    padding: 16px;
  }

  .report-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin: -16px -16px 12px;
    padding: 16px;
    border-bottom: 1px solid #dcdcdc;
  }

  .report-heading h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    color: #000;
  }

  /* The one glance the section affords when it is not being read: how many
     problems, in the colour of the worst of them. */
  .report-count {
    font-size: 12px;
    color: #5c6870;
    white-space: nowrap;
  }

  .report-panel[data-kind='warn'] .report-count {
    color: #8a5300;
  }

  .report-panel[data-kind='error'] .report-count {
    color: #a12b2b;
  }

  /* Full width and above the figures rather than beside them: the sidebar is
     ~290px and resizable, and a meter sharing a line with the byte count is the
     first thing to break when it is dragged narrower. */
  .report-meter {
    display: block;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #e6ebe9;
    overflow: hidden;
  }

  /* Hatched and faded while the measurement is older than the document, so the
     meter itself carries the caveat the label below it spells out — a bar reading
     62 % looks equally authoritative whether or not the number is current. Both,
     because either alone disappears at one end of the scale: the hatching is
     hidden under a nearly full bar and the fade has nothing to fade at 5 %. */
  .report-meter[data-stale] {
    background-image: repeating-linear-gradient(
      -45deg,
      rgb(14 17 22 / 8%) 0 3px,
      transparent 3px 6px
    );
  }

  .report-meter[data-stale] .report-meter-fill {
    opacity: 0.45;
  }

  .report-meter-fill {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: #195a7d;
    transition: width 120ms linear;
  }

  .report-panel[data-kind='warn'] .report-meter-fill {
    background: #a8741a;
  }

  .report-panel[data-kind='error'] .report-meter-fill {
    background: #a12b2b;
  }

  .report-size {
    margin: 6px 0 0;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: #0e1116;
  }

  .report-stale {
    margin: 2px 0 0;
    font-size: 12px;
    color: #5c6870;
  }

  .report-list {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  /* 'anywhere', because a note naming the address tags carries 70 characters of
     pipes and asterisks with no break opportunity in them — in a 290px column
     that is a horizontal scrollbar across the whole sidebar. */
  .report-note {
    position: relative;
    padding: 3px 0 3px 16px;
    font-size: 13px;
    line-height: 1.45;
    color: #5c6870;
    overflow-wrap: anywhere;
  }

  /* A marker per severity, so the notes stay distinguishable for anyone who
     cannot separate the two text colours. */
  .report-note::before {
    position: absolute;
    left: 0;
    content: '·';
  }

  .report-note[data-kind='warn'] {
    color: #8a5300;
  }

  .report-note[data-kind='warn']::before {
    content: '!';
  }

  .report-note[data-kind='error'] {
    color: #a12b2b;
    font-weight: 600;
  }

  .report-note[data-kind='error']::before {
    content: '×';
  }
`;
