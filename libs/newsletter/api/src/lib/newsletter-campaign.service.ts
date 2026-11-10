import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  NewsletterCampaign,
  NewsletterCampaignStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  describeRequiredTag,
  isKitId,
  KIT_IDS,
  KitId,
  LEGACY_KIT_ID,
  missingRequiredFooterTags,
  NewsletterDocument,
  newIssueDocument,
  newsletterReport,
} from '@wepublish/newsletter/email';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterRenderService } from './newsletter-render.service';
import { DocumentError, parseDocument, storedKit } from './parse';

/**
 * Publishing refused because the issue itself is not publishable — as opposed
 * to malformed (`DocumentError`) or a Mailchimp failure (`MailchimpError`).
 */
export class PublishError extends BadRequestException {}

/** The list view's cap; the archive only ever grows. */
const LIST_LIMIT = 200;

const toCampaign = (
  row: NewsletterCampaign,
  editUrl?: (webId: number) => string
) => {
  // Re-validated on the way out, not just on the way in: a document written by
  // an older build of the editor may hold a block shape this one cannot render,
  // and failing here beats rendering a silently incomplete issue.
  const document = parseDocument(row.document);

  return {
    ...row,
    document,
    blockCount: document.blocks.length,
    mailchimpEditUrl:
      editUrl && row.mailchimpCampaignWebId != null ?
        editUrl(row.mailchimpCampaignWebId)
      : undefined,
  };
};

const asJson = (document: NewsletterDocument) =>
  document as unknown as Prisma.InputJsonValue;

/**
 * The kit this medium writes new issues in: `NEWSLETTER_KIT`, or eenews where
 * it is not set — eenews had the editor to itself before there were kits.
 *
 * Read when an issue is created rather than at boot, so a typo stops nothing
 * but the creation, with a message that names the variable. An existing issue
 * keeps the kit it was written in whatever this says (see `update`).
 */
function mediumKit(): KitId {
  const configured = process.env['NEWSLETTER_KIT']?.trim();

  if (!configured) {
    return LEGACY_KIT_ID;
  }

  if (!isKitId(configured)) {
    throw new InternalServerErrorException(
      `NEWSLETTER_KIT "${configured}" ist unbekannt — möglich sind ${KIT_IDS.join(', ')}.`
    );
  }

  return configured;
}

@Injectable()
export class NewsletterCampaignService {
  constructor(
    private prisma: PrismaClient,
    private renderer: NewsletterRenderService,
    private mailchimp: NewsletterMailchimpService
  ) {}

  async list(includeArchived = false) {
    const [rows, editUrl] = await Promise.all([
      this.prisma.newsletterCampaign.findMany({
        where:
          includeArchived ? {} : { status: NewsletterCampaignStatus.active },
        orderBy: { modifiedAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.mailchimp.editUrls(),
    ]);

    return rows.map(row => toCampaign(row, editUrl));
  }

  private async row(id: string) {
    const row = await this.prisma.newsletterCampaign.findUnique({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Dieser Newsletter existiert nicht (mehr).');
    }

    return row;
  }

  async get(id: string) {
    const [row, editUrl] = await Promise.all([
      this.row(id),
      this.mailchimp.editUrls(),
    ]);

    return toCampaign(row, editUrl);
  }

  /**
   * A new issue starts from `newIssueDocument` — its title, a placeholder text
   * and the pinned closing block; an editor who wants last week's masthead and
   * rubrics duplicates last week's issue. The document goes through
   * `parseDocument` like any other input, in the medium's kit.
   */
  async create(title: string, document?: unknown) {
    const trimmed = title.trim();

    if (!trimmed) {
      throw new DocumentError('Bitte einen Titel für die Ausgabe angeben.');
    }

    const kit = mediumKit();

    return this.insert(
      trimmed,
      parseDocument(document ?? newIssueDocument(trimmed, kit), kit)
    );
  }

  private async insert(title: string, document: NewsletterDocument) {
    const row = await this.prisma.newsletterCampaign.create({
      data: { title, document: asJson(document) },
    });

    return toCampaign(row);
  }

  /**
   * A copy of the issue's document under a new title, in the kit the original
   * was written in. The Mailchimp draft stays with the original: sharing it
   * would let the copy overwrite a draft that may already be scheduled.
   */
  async duplicate(id: string) {
    const original = await this.row(id);

    return this.insert(
      `${original.title} (Kopie)`,
      parseDocument(original.document)
    );
  }

  /** The issue stays in the kit it was written in; see `parseDocument`. */
  async update(id: string, title: string | undefined, document: unknown) {
    const existing = await this.row(id);
    const parsed = parseDocument(document, storedKit(existing.document));

    const [row, editUrl] = await Promise.all([
      this.prisma.newsletterCampaign.update({
        where: { id },
        data: {
          title: title?.trim() || existing.title,
          document: asJson(parsed),
        },
      }),
      this.mailchimp.editUrls(),
    ]);

    return toCampaign(row, editUrl);
  }

  archive(id: string) {
    return this.setStatus(id, NewsletterCampaignStatus.archived);
  }

  unarchive(id: string) {
    return this.setStatus(id, NewsletterCampaignStatus.active);
  }

  /**
   * Archiving is not an edit of the issue: `modifiedAt` is written back as it
   * was, or `@updatedAt` would move every archived or restored issue to the
   * top of the list.
   */
  private async setStatus(id: string, status: NewsletterCampaignStatus) {
    const existing = await this.row(id);

    const [row, editUrl] = await Promise.all([
      this.prisma.newsletterCampaign.update({
        where: { id },
        data: { status, modifiedAt: existing.modifiedAt },
      }),
      this.mailchimp.editUrls(),
    ]);

    return toCampaign(row, editUrl);
  }

  /**
   * Preview and report share one render: the report has to measure the very
   * HTML the preview shows. Unresolved articles are rendered as a visible note
   * rather than failing — a preview exists to show what is wrong.
   */
  async preview(id: string) {
    const { html } = await this.renderer.render(
      parseDocument((await this.row(id)).document)
    );

    return html;
  }

  async report(id: string) {
    const { html, missing } = await this.renderer.render(
      parseDocument((await this.row(id)).document)
    );

    return newsletterReport(html, missing);
  }

  /**
   * Renders the stored issue into its Mailchimp draft. Never sends or schedules
   * a campaign — sending stays a manual step in Mailchimp.
   */
  async publish(id: string) {
    const campaign = await this.row(id);
    const { html, document, missing } = await this.renderer.render(
      parseDocument(campaign.document)
    );

    // Publishing is the point of no return for the text, so a teaser whose
    // article has vanished stops it. The preview renders the same issue as a
    // visible note.
    if (missing.length) {
      throw new PublishError(
        `${missing.length} Artikel konnten nicht geladen werden. Bitte im Editor prüfen.`
      );
    }

    // Mailchimp refuses to *send* a campaign without an unsubscribe link and a
    // postal address, but accepts the draft happily — so an issue missing them
    // would read as published here and fail at the send, in front of a deadline.
    const missingTags = missingRequiredFooterTags(html);

    if (missingTags.length) {
      throw new PublishError(
        `In der Fusszeile fehlen von Mailchimp verlangte Merge-Tags: ${missingTags
          .map(describeRequiredTag)
          .join(', ')}.`
      );
    }

    const pushed = await this.mailchimp.pushDraft(
      campaign.mailchimpCampaignId,
      {
        title: campaign.title,
        subject: campaign.title,
        previewText: document.preheader,
      },
      html
    );

    await this.prisma.newsletterCampaign.update({
      where: { id },
      data: {
        mailchimpCampaignId: pushed.campaign.id,
        mailchimpCampaignWebId: pushed.campaign.webId,
      },
    });

    return { ...pushed, report: newsletterReport(html, missing) };
  }
}
