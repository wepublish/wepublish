import { UnprocessableEntityException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  articleIdsIn,
  describeRequiredTag,
  missingRequiredFooterTags,
} from '@wepublish/newsletter';
import {
  CanCreateNewsletter,
  CanDeleteNewsletter,
  CanGetNewsletter,
  CanGetNewsletters,
  CanPublishNewsletter,
  CanUpdateNewsletter,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { NewsletterContentService } from './newsletter-content.service';
import {
  editUrlFor,
  NewsletterMailchimpService,
} from './newsletter-mailchimp.service';
import {
  CreateNewsletterInput,
  Newsletter,
  NewsletterArticle,
  NewsletterArticlesArgs,
  NewsletterImage,
  NewsletterListArgs,
  NewsletterMergeFieldCatalogue,
  NewsletterPreview,
  NewsletterPublishResult,
  PaginatedNewsletters,
  UpdateNewsletterInput,
} from './newsletter.model';
import { NewsletterService, ParsedNewsletter } from './newsletter.service';

@Resolver(() => Newsletter)
export class NewsletterResolver {
  constructor(
    private newsletterService: NewsletterService,
    private content: NewsletterContentService,
    private mailchimp: NewsletterMailchimpService
  ) {}

  @Permissions(CanGetNewsletters)
  @Query(() => PaginatedNewsletters, {
    description: 'Newsletters, most recently modified first.',
  })
  newsletters(@Args() args: NewsletterListArgs) {
    return this.newsletterService.list(args);
  }

  @Permissions(CanGetNewsletter)
  @Query(() => Newsletter)
  newsletter(@Args('id') id: string) {
    return this.newsletterService.findById(id);
  }

  @Permissions(CanGetNewsletter)
  @Query(() => NewsletterPreview, {
    description:
      'The stored newsletter rendered to the HTML Mailchimp would receive, with its size report.',
  })
  async newsletterPreview(@Args('id') id: string): Promise<NewsletterPreview> {
    const newsletter = await this.newsletterService.findById(id);

    return this.content.render(newsletter.document);
  }

  @Permissions(CanGetNewsletter)
  @Query(() => [NewsletterArticle], {
    description: 'Published articles the teaser picker offers, newest first.',
  })
  newsletterArticles(
    @Args() { days = 90, take = 500 }: NewsletterArticlesArgs
  ) {
    return this.content.recentArticles(
      Math.min(Math.max(days, 1), 365),
      Math.min(Math.max(take, 1), 1000)
    );
  }

  @Permissions(CanGetNewsletter)
  @Query(() => [NewsletterImage], {
    description: 'CMS images by id, as the mail renders them.',
  })
  async newsletterImages(
    @Args('ids', { type: () => [String] }) ids: string[]
  ): Promise<NewsletterImage[]> {
    const images = await this.content.imagesFor({
      preheader: '',
      blocks: ids.map(imageId => ({ type: 'image', imageId, alt: '' })),
    });

    return [...images.values()];
  }

  /**
   * The audience's merge fields for the editor's tag picker. Failures are
   * reported in the payload: the system tags are bundled in the editor and
   * the picker stays useful on an instance without a Mailchimp integration.
   */
  @Permissions(CanGetNewsletter)
  @Query(() => NewsletterMergeFieldCatalogue)
  async newsletterMergeFields(): Promise<NewsletterMergeFieldCatalogue> {
    try {
      const config = await this.mailchimp.config();
      const audience = await this.mailchimp.fetchAudience(config);
      const [fields, interests] = await Promise.all([
        this.mailchimp.fetchMergeFields(config.apiKey, audience.id),
        this.mailchimp.fetchInterestCategories(config.apiKey, audience.id).then(
          categories => ({
            categories,
            error: undefined as string | undefined,
          }),
          (error: unknown) => ({
            categories: [],
            error: `Interest groups could not be loaded: ${
              error instanceof Error ? error.message : String(error)
            }`,
          })
        ),
      ]);

      return {
        fields: fields.map(field => ({ tag: field.tag, name: field.label })),
        interests: interests.categories,
        error: interests.error,
      };
    } catch (error) {
      return {
        fields: [],
        interests: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Permissions(CanCreateNewsletter)
  @Mutation(() => Newsletter)
  createNewsletter(@Args('input') input: CreateNewsletterInput) {
    return this.newsletterService.create(input);
  }

  @Permissions(CanUpdateNewsletter)
  @Mutation(() => Newsletter)
  updateNewsletter(@Args('input') input: UpdateNewsletterInput) {
    return this.newsletterService.update(input);
  }

  @Permissions(CanDeleteNewsletter)
  @Mutation(() => Newsletter)
  deleteNewsletter(@Args('id') id: string) {
    return this.newsletterService.delete(id);
  }

  /**
   * Renders the stored newsletter into a Mailchimp draft: one campaign per
   * newsletter, created on the first publish and patched afterwards. A
   * remembered campaign that was deleted or already sent is not reused. The
   * campaign is never sent or scheduled from here.
   */
  @Permissions(CanPublishNewsletter)
  @Mutation(() => NewsletterPublishResult)
  async publishNewsletterToMailchimp(
    @Args('id') id: string
  ): Promise<NewsletterPublishResult> {
    const config = await this.mailchimp.config();
    const newsletter = await this.newsletterService.findById(id);
    const { html, report } = await this.content.render(newsletter.document);

    if (report.missingArticles.length) {
      throw new UnprocessableEntityException(
        `${report.missingArticles.length} teased article(s) could not be loaded. Check the newsletter in the editor.`
      );
    }

    if (report.missingImages.length) {
      throw new UnprocessableEntityException(
        `${report.missingImages.length} image(s) could not be loaded. Check the newsletter in the editor.`
      );
    }

    // Mailchimp accepts a draft without these and refuses only at the send.
    const missingTags = missingRequiredFooterTags(html);

    if (missingTags.length) {
      throw new UnprocessableEntityException(
        `The footer lacks merge tags Mailchimp requires: ${missingTags
          .map(describeRequiredTag)
          .join(', ')}.`
      );
    }

    const fields = {
      title: newsletter.title,
      subject: newsletter.title,
      previewText: newsletter.document.preheader,
    };

    const existing =
      newsletter.mailchimpCampaignId ?
        await this.mailchimp.findReusableDraft(
          config.apiKey,
          newsletter.mailchimpCampaignId
        )
      : null;

    let campaign;
    let created: boolean;

    if (existing) {
      // Settings first, HTML second: a settings patch re-renders the campaign
      // and would discard HTML uploaded before it.
      await this.mailchimp.updateDraftCampaign(
        config.apiKey,
        existing.id,
        fields
      );
      campaign = {
        id: existing.id,
        webId: existing.webId,
        title: fields.title,
        editUrl: editUrlFor(config.apiKey, existing.webId),
      };
      created = false;
    } else {
      const audience = await this.mailchimp.fetchAudience(config);
      campaign = await this.mailchimp.createDraftCampaign(
        config.apiKey,
        audience,
        fields
      );
      created = true;
    }

    await this.mailchimp.setCampaignHtml(config.apiKey, campaign.id, html);
    await this.newsletterService.recordCampaign(
      id,
      campaign.id,
      campaign.webId
    );

    return { campaign, created, report };
  }

  @ResolveField(() => Number)
  blockCount(@Parent() newsletter: ParsedNewsletter) {
    return newsletter.document.blocks.length;
  }

  @ResolveField(() => String, { nullable: true })
  async mailchimpEditUrl(@Parent() newsletter: ParsedNewsletter) {
    if (!newsletter.mailchimpCampaignWebId) {
      return null;
    }

    try {
      const { apiKey } = await this.mailchimp.config();

      return editUrlFor(apiKey, newsletter.mailchimpCampaignWebId);
    } catch {
      return null;
    }
  }

  @ResolveField(() => [NewsletterArticle])
  async teaserArticles(@Parent() newsletter: ParsedNewsletter) {
    const articles = await this.content.articlesByIds(
      articleIdsIn(newsletter.document)
    );

    return [...articles.values()];
  }

  @ResolveField(() => [NewsletterImage])
  async images(@Parent() newsletter: ParsedNewsletter) {
    const images = await this.content.imagesFor(newsletter.document);

    return [...images.values()];
  }
}
