import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsletterCampaign, Prisma, PrismaClient } from '@prisma/client';
import { createArticleFilter } from '@wepublish/article/api';
import {
  DEFAULT_DOCUMENT,
  describeRequiredTag,
  missingRequiredFooterTags,
  NewsletterBlock,
  NewsletterDocument,
  newsletterReport,
} from '@wepublish/newsletter/email';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterRenderService } from './newsletter-render.service';
import { DocumentError, parseDocument } from './parse';

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

@Injectable()
export class NewsletterCampaignService {
  constructor(
    private prisma: PrismaClient,
    private renderer: NewsletterRenderService,
    private mailchimp: NewsletterMailchimpService
  ) {}

  async list() {
    const [rows, editUrl] = await Promise.all([
      this.prisma.newsletterCampaign.findMany({
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
   * The default issue with every sample teaser pointing at the newest article
   * the website lists — published and not hidden, by the website's own filter —
   * so the sample renders on any instance. With nothing published yet the
   * sample teasers are left out: a teaser without an article cannot be stored.
   */
  private async sampleDocument(): Promise<NewsletterDocument> {
    const newest = await this.prisma.article.findFirst({
      where: createArticleFilter({ published: true }),
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    });

    return {
      ...DEFAULT_DOCUMENT,
      blocks: DEFAULT_DOCUMENT.blocks.flatMap((block): NewsletterBlock[] => {
        if (block.type !== 'teaser') {
          return [block];
        }

        return newest ? [{ ...block, articleId: newest.id }] : [];
      }),
    };
  }

  /**
   * A new issue starts from the default rather than blank: the masthead, intro,
   * rubric order and two articles per rubric are the same every week, so an
   * editor edits rather than assembles. It goes through `parseDocument` like any
   * other input; a default that skipped validation would be the one document
   * that could break the render.
   */
  async create(title: string, document?: unknown) {
    const trimmed = title.trim();

    if (!trimmed) {
      throw new DocumentError('Bitte einen Titel für die Ausgabe angeben.');
    }

    const row = await this.prisma.newsletterCampaign.create({
      data: {
        title: trimmed,
        document: asJson(
          parseDocument(document ?? (await this.sampleDocument()))
        ),
      },
    });

    return toCampaign(row);
  }

  async update(id: string, title: string | undefined, document: unknown) {
    const parsed = parseDocument(document);
    const existing = await this.row(id);

    const row = await this.prisma.newsletterCampaign.update({
      where: { id },
      data: {
        title: title?.trim() || existing.title,
        document: asJson(parsed),
      },
    });

    return toCampaign(row);
  }

  async delete(id: string) {
    await this.row(id);
    await this.prisma.newsletterCampaign.delete({ where: { id } });
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
