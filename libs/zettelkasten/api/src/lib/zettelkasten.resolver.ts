import { Inject, Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CanCreateArticle } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { GraphQLJSON } from 'graphql-scalars';

import {
  ZettelkastenClientService,
  ZettelkastenError,
} from './zettelkasten-client.service';
import {
  ZettelkastenAnchorsArgs,
  ZettelkastenArchiveArgs,
  ZettelkastenDailyReportArgs,
  ZettelkastenEvidenceArgs,
  ZettelkastenPageArgs,
  ZettelkastenSearchArgs,
} from './zettelkasten.model';

/** How many dossier hits one anchor has; `null` means the door did not answer. */
type AnchorCount = { anchor: string; hits: number | null };

/**
 * Anchors are checked five at a time. Every anchor still costs one call to the
 * door, but at most four rounds of them run one after the other, so a door that
 * only times out cannot hold a single request for twenty timeouts in a row.
 */
const ANCHOR_BATCH_SIZE = 5;

/**
 * Read access to the knowledge provider for everyone who may write articles.
 * Payloads are passed through unchanged so evidence is not lost in translation.
 */
@Resolver()
export class ZettelkastenResolver {
  private readonly logger = new Logger(ZettelkastenResolver.name);

  constructor(
    @Inject(ZettelkastenClientService)
    private readonly client: ZettelkastenClientService
  ) {}

  @Permissions(CanCreateArticle)
  @Query(() => Boolean, {
    description:
      'Whether this editor has an enabled, complete knowledge provider setting.',
  })
  zettelkastenEnabled() {
    return this.client.isEnabled();
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description: 'Full text search over the dossiers (wiki_suche).',
  })
  zettelkastenSearch(
    @Args({ type: () => ZettelkastenSearchArgs })
    { query, limit, offset }: ZettelkastenSearchArgs
  ) {
    return this.client.call('wiki_suche', {
      suche: query,
      grenze: limit,
      versatz: offset,
    });
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description:
      'One dossier page with all facts and source lines (wiki_seite).',
  })
  zettelkastenPage(
    @Args({ type: () => ZettelkastenPageArgs }) { page }: ZettelkastenPageArgs
  ) {
    return this.client.call('wiki_seite', { seite: page });
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description:
      'The raw store entry behind a fact, optionally checking a quote (quelle_zeigen).',
  })
  zettelkastenEvidence(
    @Args({ type: () => ZettelkastenEvidenceArgs })
    { evidence, quote }: ZettelkastenEvidenceArgs
  ) {
    return this.client.call('quelle_zeigen', { beleg: evidence, zitat: quote });
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description:
      'Full text search over articles and newsletters (archiv_suche).',
  })
  zettelkastenArchive(
    @Args({ type: () => ZettelkastenArchiveArgs })
    { query, source, limit, offset }: ZettelkastenArchiveArgs
  ) {
    return this.client.call('archiv_suche', {
      suche: query,
      quelle: source,
      grenze: limit,
      versatz: offset,
    });
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description: 'The latest journal entries (tagesrapport).',
  })
  zettelkastenDailyReport(
    @Args({ type: () => ZettelkastenDailyReportArgs })
    { count }: ZettelkastenDailyReportArgs
  ) {
    return this.client.call('tagesrapport', { anzahl: count });
  }

  @Permissions(CanCreateArticle)
  @Query(() => GraphQLJSON, {
    description:
      'For every anchor: how many wiki hits there are (wiki_suche, limit 1). Nothing is judged.',
  })
  async zettelkastenAnchors(
    @Args({ type: () => ZettelkastenAnchorsArgs })
    { anchors }: ZettelkastenAnchorsArgs
  ) {
    if (anchors.length > 20) {
      throw new ZettelkastenError(
        'At most twenty anchors per call',
        'ungueltige_eingabe'
      );
    }
    const checked: AnchorCount[] = [];

    for (let index = 0; index < anchors.length; index += ANCHOR_BATCH_SIZE) {
      checked.push(
        ...(await Promise.all(
          anchors
            .slice(index, index + ANCHOR_BATCH_SIZE)
            .map(anchor => this.countAnchor(anchor))
        ))
      );
    }

    return { anchors: checked };
  }

  /**
   * One anchor, one call. A failed call answers `null`, never zero: the panel
   * must be able to tell «no dossier» from «not checked», and the failure of
   * one anchor must not take the counts of the other nineteen down with it.
   */
  private async countAnchor(anchor: string): Promise<AnchorCount> {
    try {
      const payload = (await this.client.call('wiki_suche', {
        suche: `"${anchor.replace(/"/g, '')}"`,
        grenze: 1,
        versatz: 0,
      })) as { gesamt?: number };

      return { anchor, hits: payload?.gesamt ?? 0 };
    } catch {
      // Without the anchor: it is a word pair out of the article and can name
      // a private person, which has no business in a server log.
      this.logger.warn('One anchor could not be checked, it counts as unknown');

      return { anchor, hits: null };
    }
  }
}
