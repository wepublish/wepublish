import { Inject } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CanCreateArticle } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { GraphQLJSON } from 'graphql-scalars';

import { ZettelkastenClientService } from './zettelkasten-client.service';
import {
  ZettelkastenArchiveArgs,
  ZettelkastenDailyReportArgs,
  ZettelkastenEvidenceArgs,
  ZettelkastenPageArgs,
  ZettelkastenSearchArgs,
} from './zettelkasten.model';

/**
 * Read access to the knowledge provider for everyone who may write articles.
 * Payloads are passed through unchanged so evidence is not lost in translation.
 */
@Resolver()
export class ZettelkastenResolver {
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
}
