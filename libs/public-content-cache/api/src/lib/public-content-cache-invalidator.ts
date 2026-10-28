import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  CatchUpScheduler,
  NamespaceResets,
  REPLICAS_CAUGHT_UP_MS,
} from '@wepublish/kv-ttl-cache/api';
import { PublicationTimers } from '@wepublish/utils/api';
import {
  WebsiteLayoutSignal,
  WebsitePathsSignal,
} from '@wepublish/website-revalidation/api';
import {
  type ArticlePage,
  NAVIGATIONS_NAMESPACE,
  type PublicContent,
  PUBLIC_COMMENTS_NAMESPACE,
  PUBLIC_CONTENT_NAMESPACE,
  articlePagePaths,
  contentCacheNamespace,
} from './public-content-namespaces';

const LONGEST_SCHEDULE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PublicContentCacheInvalidator implements OnModuleDestroy {
  private timers = new Map<string, PublicationTimers>();

  constructor(
    private readonly resets: NamespaceResets,
    private readonly paths: WebsitePathsSignal,
    private readonly layout: WebsiteLayoutSignal,
    private readonly catchUp: CatchUpScheduler
  ) {}

  onModuleDestroy() {
    for (const timers of this.timers.values()) {
      timers.clear();
    }
  }

  invalidateAt(at: Date | null | undefined, ...contents: PublicContent[]) {
    const wait = (at?.getTime() ?? Number.NaN) - Date.now();

    if (!at || !(wait > 0) || wait > LONGEST_SCHEDULE_MS) {
      return;
    }

    const key = [...contents].sort().join(',');
    const timers = this.timers.get(key) ?? new PublicationTimers();
    this.timers.set(key, timers);
    timers.schedule([at], () => this.invalidate(...contents));
  }

  invalidateNavigations() {
    return this.resets.reset(NAVIGATIONS_NAMESPACE);
  }

  async invalidate(...contents: PublicContent[]) {
    await this.invalidateDraft(...contents);
    await this.resetPublicContent();
  }

  private async resetPublicContent(options?: { silent?: boolean }) {
    await this.resets.reset(PUBLIC_CONTENT_NAMESPACE, options);

    this.catchUp.after(REPLICAS_CAUGHT_UP_MS, () =>
      this.resets.reset(PUBLIC_CONTENT_NAMESPACE, options)
    );
  }

  async invalidateDraft(...contents: PublicContent[]) {
    await Promise.all(
      contents.map(content => this.resets.reset(contentCacheNamespace(content)))
    );
  }

  async invalidateArticlePages(...articles: ArticlePage[]) {
    await this.paths.changed([...new Set(articles.flatMap(articlePagePaths))]);
  }

  async invalidateArticleAnswers(...articles: ArticlePage[]) {
    await this.resetPublicContent({ silent: true });
    await this.invalidateArticlePages(...articles);
  }

  invalidateArticleLayout() {
    return this.layout.changed();
  }

  async invalidateComments(removed = false, ...articles: ArticlePage[]) {
    await this.resets.reset(PUBLIC_COMMENTS_NAMESPACE);

    if (removed) {
      await this.invalidate();
    }

    if (articles.length) {
      await this.invalidateArticlePages(...articles);
    }
  }

  async invalidateReaderComments(removed = false, ...articles: ArticlePage[]) {
    await this.resets.reset(PUBLIC_COMMENTS_NAMESPACE);

    if (removed) {
      await this.resetPublicContent({ silent: true });
    }

    if (articles.length) {
      await this.invalidateArticlePages(...articles);
    }
  }
}
