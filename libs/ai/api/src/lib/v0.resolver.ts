import { Args, Query, Resolver } from '@nestjs/graphql';
import { Chat, PromptHTMLArgs } from './v0.model';
import { ChatsCreateResponse, createClient } from 'v0-sdk';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

type V0Settings = { apiKey: string | null; systemPrompt: string | null };

class V0Config {
  private readonly ttl = 21600; // 6h

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async loadV0(): Promise<V0Settings> {
    await this.prisma.settingAIProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });
    const row = await this.prisma.settingAIProvider.findUnique({
      where: { id: this.id },
      select: { apiKey: true, systemPrompt: true },
    });

    return {
      apiKey: row?.apiKey ?? null,
      systemPrompt: row?.systemPrompt ?? null,
    };
  }

  async getV0(): Promise<V0Settings> {
    return this.kv.getOrLoadNs<V0Settings>(
      'settings:ai',
      `${this.id}`,
      () => this.loadV0(),
      this.ttl
    );
  }

  async apiKey(): Promise<string | null> {
    return (await this.getV0()).apiKey;
  }

  async systemPrompt(): Promise<string | null> {
    return (await this.getV0()).systemPrompt;
  }
}

@Resolver()
export class V0Resolver {
  private async getV0Client() {
    const config = new V0Config(this.prisma, this.kv, 'v0');
    const apiKey = await config.apiKey();

    if (!apiKey) {
      throw new Error('V0 API key required');
    }

    return createClient({
      apiKey,
    });
  }

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => Chat)
  async promptHTML(@Args() { query, chatId }: PromptHTMLArgs): Promise<Chat> {
    const v0 = await this.getV0Client();
    const config = new V0Config(this.prisma, this.kv, 'v0');
    let systemPrompt = await config.systemPrompt();
    if (!systemPrompt) {
      systemPrompt = '';
    }

    const chat =
      !chatId ?
        await v0.chats.create({
          message: query.trim(),
          system: systemPrompt.trim(),
          responseMode: 'sync',
          modelConfiguration: {
            thinking: false,
          },
        })
      : await v0.chats.sendMessage({
          chatId,
          message: query.trim(),
          responseMode: 'sync',
          modelConfiguration: {
            thinking: false,
          },
        });

    const [result] = (chat as ChatsCreateResponse).messages.flatMap(msg =>
      msg.experimental_content?.flatMap(content => {
        const messages = content[1] as Array<
          [string, { lang: string }, string]
        >;

        return (
          messages.find(
            ([type, config]) => type === 'Codeblock' && config.lang === 'html'
          )?.[2] ?? []
        );
      })
    );

    if (!result) {
      throw new BadRequestException('No HTML returned by v0');
    }

    return {
      chatId: (chat as ChatsCreateResponse).id,
      message: result,
    };
  }
}
