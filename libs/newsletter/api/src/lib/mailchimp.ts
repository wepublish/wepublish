/**
 * Minimal Mailchimp Marketing API client.
 *
 * The datacenter is the suffix of the API key (`…-us22`), so no separate
 * setting is needed. Auth is HTTP Basic with any username.
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import type { InterestCategory, MergeTag } from '@wepublish/newsletter/email';
import { INTEREST_NAME, isSystemMergeTag } from '@wepublish/newsletter/email';

/**
 * Always answered as a 502, whatever Mailchimp said: a 401 for a revoked key
 * passed through as is would read to the editor as its own session expiring.
 * Mailchimp's own status is kept for the callers that branch on it.
 */
export class MailchimpError extends HttpException {
  constructor(
    message: string,
    readonly upstreamStatus: number
  ) {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}

export interface CreatedCampaign {
  id: string;
  webId: number;
  title: string;
  editUrl: string;
}

function datacenter(apiKey: string): string {
  const dc = apiKey.split('-').pop();

  if (!dc || dc === apiKey) {
    throw new MailchimpError(
      'Dem Mailchimp-API-Key fehlt das Rechenzentrum («-usXX»).',
      500
    );
  }

  return dc;
}

export function editUrlFor(apiKey: string, webId: number): string {
  return `https://${datacenter(apiKey)}.admin.mailchimp.com/campaigns/edit?id=${webId}`;
}

/**
 * The campaign as the editor is told about it.
 *
 * A publish either creates a draft or reuses the remembered one, and both paths
 * have to report the same four fields — assembling them twice is how the reused
 * branch ends up with a subtly different `editUrl`.
 */
export function createdCampaign(
  apiKey: string,
  id: string,
  webId: number,
  title: string
): CreatedCampaign {
  return { id, webId, title, editUrl: editUrlFor(apiKey, webId) };
}

async function call<T>(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(
    `https://${datacenter(apiKey)}.api.mailchimp.com/3.0${path}`,
    {
      method,
      headers: {
        authorization: `Basic ${btoa(`key:${apiKey}`)}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!response.ok) {
    let detail = text.slice(0, 300);

    try {
      const parsed = JSON.parse(text) as { detail?: string; title?: string };
      detail = parsed.detail ?? parsed.title ?? detail;
    } catch {
      // keep the raw body
    }

    throw new MailchimpError(
      `Mailchimp ${method} ${path} failed: ${detail}`,
      response.status
    );
  }

  return JSON.parse(text) as T;
}

export interface Audience {
  id: string;
  name: string;
  fromName?: string;
  fromEmail?: string;
}

/**
 * The audience a published issue is addressed to: the list of the Mailchimp
 * integration. The sender comes straight from the list's own
 * `campaign_defaults`, which is where the editors set it anyway.
 */
export async function fetchAudience(
  apiKey: string,
  audienceId: string
): Promise<Audience> {
  const chosen = await call<{
    id: string;
    name: string;
    campaign_defaults?: { from_name?: string; from_email?: string };
  }>(apiKey, 'GET', `/lists/${audienceId}?fields=id,name,campaign_defaults`);

  return {
    id: chosen.id,
    name: chosen.name,
    fromName: chosen.campaign_defaults?.from_name || undefined,
    fromEmail: chosen.campaign_defaults?.from_email || undefined,
  };
}

/**
 * The audience's own merge fields, as tags the prose picker can offer.
 *
 * These are the columns of the contact table — `FNAME`, `LNAME`, whatever the
 * editors added — so unlike the system tags they belong to the account and have
 * to be asked for. Anything Mailchimp also documents as a system tag (`EMAIL`
 * is both) is dropped here rather than offered twice under two names.
 *
 * `required` and `default_value` are deliberately not carried over: they say
 * what the *signup form* insists on, not what a newsletter may use, and an editor
 * reading "Pflichtfeld" beside a tag would take it for the footer requirement
 * `merge-tags.ts` checks.
 */
export async function fetchMergeFields(
  apiKey: string,
  audienceId: string
): Promise<MergeTag[]> {
  const data = await call<{ merge_fields: { tag: string; name: string }[] }>(
    apiKey,
    'GET',
    `/lists/${audienceId}/merge-fields?count=100&fields=merge_fields.tag,merge_fields.name`
  );

  return data.merge_fields
    .map(field => ({
      tag: `*|${field.tag}|*`,
      label: field.name || field.tag,
      description: `Feld «${field.tag}» aus dem Mailchimp-Publikum.`,
    }))
    .filter(field => !isSystemMergeTag(field.tag));
}

/**
 * The audience's interest categories — what Mailchimp's UI calls **groups** —
 * and the group names inside each.
 *
 * These are not merge tags and must never be offered as ones: a group is not
 * substituted into text but addressed by a conditional block of its own,
 * `*|INTERESTED:Kategorie:Gruppe|*` … `*|END:INTERESTED|*`, so inserting one
 * into a paragraph would leave an unbalanced conditional in the sent mail. They
 * therefore travel *beside* `MergeTag[]` rather than among it, and only the
 * editor's condition row reads them. `conditionTags` builds the pair.
 *
 * Two requests deep, because Mailchimp models the halves separately and the tag
 * needs both: the category supplies the title before the second colon and its
 * interests the name after it. Affordable — a category list is short (Mailchimp
 * caps an audience at 60) and this route is fetched once per editor page.
 *
 * A name `INTEREST_NAME` refuses is dropped rather than offered, and a category
 * left with no usable group is dropped whole: the dropdown would otherwise list
 * a category whose value box has nothing to choose from.
 */
export async function fetchInterestCategories(
  apiKey: string,
  audienceId: string
): Promise<InterestCategory[]> {
  const data = await call<{ categories: { id: string; title: string }[] }>(
    apiKey,
    'GET',
    `/lists/${audienceId}/interest-categories?count=60&fields=categories.id,categories.title`
  );

  const filled = await Promise.all(
    data.categories
      .filter(category => INTEREST_NAME.test(category.title))
      // Concurrent rather than in sequence: this is already the slowest thing
      // behind `newsletterMergeFields`, and an audience with six categories would
      // otherwise pay six round trips end to end.
      .map(async category => {
        const interests = await call<{ interests: { name: string }[] }>(
          apiKey,
          'GET',
          `/lists/${audienceId}/interest-categories/${category.id}/interests?count=200&fields=interests.name`
        );

        return {
          title: category.title,
          groups: interests.interests
            .map(interest => interest.name)
            .filter(name => INTEREST_NAME.test(name)),
        };
      })
  );

  return filled.filter(category => category.groups.length > 0);
}

export interface CampaignFields {
  /** Internal name in the campaign list. */
  title: string;
  subject: string;
  /** Shown next to the subject in the inbox; the document's preheader. */
  previewText: string;
}

function settingsFor(fields: CampaignFields): Record<string, unknown> {
  return {
    title: fields.title,
    // Mailchimp rejects a campaign without a subject line, and an issue whose
    // subject is its internal title is easier to fix than one that fails to save.
    subject_line: fields.subject || fields.title,
    preview_text: fields.previewText,
  };
}

/**
 * Creates the draft an issue is published into.
 *
 * It deliberately carries **no** `template_id`, and is created from scratch
 * rather than via `POST /campaigns/{id}/actions/replicate`.
 *
 * A replica inherits `settings.template_id`, which leaves it at
 * `content_type: "template"` — a campaign Mailchimp renders *from its template*.
 * Uploaded HTML then loses against the template: the PUT returns 200 and the
 * campaign shows Mailchimp's default "Getting started" boilerplate. Observed
 * against the live API and not deterministic: the same three calls sometimes keep
 * the HTML and sometimes revert it immediately. `PATCH`ing `template_id: 0` does
 * not help — Mailchimp ignores it and the value stays 13.
 *
 * Creating fresh yields `content_type: "html"` with `template_id: 0`. With no
 * template behind it there is nothing to re-render from, so the HTML sticks.
 */
export async function createDraftCampaign(
  apiKey: string,
  audience: Audience,
  fields: CampaignFields
): Promise<CreatedCampaign> {
  const created = await call<{ id: string; web_id: number }>(
    apiKey,
    'POST',
    '/campaigns',
    {
      type: 'regular',
      recipients: { list_id: audience.id },
      settings: {
        ...settingsFor(fields),
        ...(audience.fromName ? { from_name: audience.fromName } : {}),
        ...(audience.fromEmail ? { reply_to: audience.fromEmail } : {}),
      },
    }
  );

  return createdCampaign(apiKey, created.id, created.web_id, fields.title);
}

export async function updateDraftCampaign(
  apiKey: string,
  campaignId: string,
  fields: CampaignFields
): Promise<void> {
  await call(apiKey, 'PATCH', `/campaigns/${campaignId}`, {
    settings: settingsFor(fields),
  });
}

/**
 * Uploads the rendered issue.
 *
 * Always called *after* any settings patch, never before: patching settings
 * makes Mailchimp re-render the campaign, which throws away HTML uploaded a
 * moment earlier. Observed against the live API.
 */
export async function setCampaignHtml(
  apiKey: string,
  campaignId: string,
  html: string
): Promise<void> {
  await call(apiKey, 'PUT', `/campaigns/${campaignId}/content`, { html });
}

/**
 * The campaign an issue was published to last time, if it is still there and
 * still editable.
 *
 * Returns null when it was deleted in Mailchimp or has already been sent —
 * either way the next publish must create a fresh draft rather than overwrite
 * something the editors have moved on from. Overwriting a *sent* campaign would
 * rewrite the archive of an issue subscribers already received.
 */
export async function findReusableDraft(
  apiKey: string,
  campaignId: string
): Promise<{ id: string; webId: number } | null> {
  try {
    const campaign = await call<{ id: string; web_id: number; status: string }>(
      apiKey,
      'GET',
      `/campaigns/${campaignId}`
    );

    return campaign.status === 'save' ?
        { id: campaign.id, webId: campaign.web_id }
      : null;
  } catch (cause) {
    if (cause instanceof MailchimpError && cause.upstreamStatus === 404) {
      return null;
    }

    throw cause;
  }
}
