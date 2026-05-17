export interface HtmlMailWarning {
  /** stable code so a future translation file can localize the message */
  code: string;
  /** human-readable description (fallback) */
  message: string;
  severity: 'error' | 'warning';
}

const PATTERNS: Array<{
  code: string;
  message: string;
  severity: 'error' | 'warning';
  pattern: RegExp;
}> = [
  {
    code: 'script-tag',
    message:
      'Mail clients block <script> tags. Remove all JavaScript from the template.',
    severity: 'error',
    pattern: /<script[\s>]/i,
  },
  {
    code: 'iframe-tag',
    message:
      'Most mail clients block <iframe>. Replace with a static image link.',
    severity: 'warning',
    pattern: /<iframe[\s>]/i,
  },
  {
    code: 'form-tag',
    message:
      '<form> elements are stripped by many mail clients. Link to a hosted form instead.',
    severity: 'warning',
    pattern: /<form[\s>]/i,
  },
  {
    code: 'video-tag',
    message:
      '<video> is unsupported in most mail clients. Use an animated GIF or link to a hosted player.',
    severity: 'warning',
    pattern: /<video[\s>]/i,
  },
  {
    code: 'external-stylesheet',
    message:
      'External stylesheets (<link rel="stylesheet">) are stripped by Gmail and Outlook. Inline CSS instead.',
    severity: 'warning',
    pattern: /<link[^>]+rel\s*=\s*["']?stylesheet/i,
  },
  {
    code: 'style-block',
    message:
      'A <style> block was found. Many mail clients (Gmail mobile, Outlook) ignore or strip these — prefer inline CSS via style="".',
    severity: 'warning',
    pattern: /<style[\s>]/i,
  },
  {
    code: 'css-position',
    message:
      'CSS position:absolute/fixed/sticky is not supported in most mail clients. Use tables for layout.',
    severity: 'warning',
    pattern: /position\s*:\s*(absolute|fixed|sticky)/i,
  },
  {
    code: 'flex-or-grid',
    message:
      'Flexbox / Grid layouts render inconsistently across mail clients (Outlook). Prefer <table> layouts.',
    severity: 'warning',
    pattern: /display\s*:\s*(flex|grid|inline-flex|inline-grid)/i,
  },
  {
    code: 'embedded-js-event',
    message:
      'Inline JavaScript event handlers (onclick, onload, ...) are stripped by every mail client.',
    severity: 'error',
    pattern:
      /\son(click|load|mouseover|focus|blur|change|submit|keyup|keydown)\s*=/i,
  },
  {
    code: 'object-tag',
    message: '<object> / <embed> are blocked by every mail client.',
    severity: 'error',
    pattern: /<(object|embed)[\s>]/i,
  },
];

export function analyseMailHtml(html: string): HtmlMailWarning[] {
  if (!html) {
    return [];
  }
  const warnings: HtmlMailWarning[] = [];
  for (const rule of PATTERNS) {
    if (rule.pattern.test(html)) {
      warnings.push({
        code: rule.code,
        message: rule.message,
        severity: rule.severity,
      });
    }
  }
  return warnings;
}
