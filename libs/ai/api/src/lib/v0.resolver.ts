import { Args, Query, Resolver } from '@nestjs/graphql';
import { Chat, PromptHTMLArgs } from './v0.model';
import { ChatsCreateResponse, createClient } from 'v0-sdk';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import { BadRequestException, Inject } from '@nestjs/common';

export const V0_CONFIG = Symbol('V0_CONFIG');
export type V0Config = {
  apiKey: string;
  systemPrompt: string;
};

@Resolver()
export class V0Resolver {
  private v0 = createClient({
    apiKey: this.config.apiKey,
  });

  constructor(
    @Inject(V0_CONFIG)
    private config: V0Config
  ) {}

  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => Chat)
  async promptHTML(@Args() { query, chatId }: PromptHTMLArgs): Promise<Chat> {
    const chat =
      !chatId ?
        await this.v0.chats.create({
          message: query.trim(),
          system: this.config.systemPrompt.trim(),
          responseMode: 'sync',
          modelConfiguration: {
            thinking: false,
          },
        })
      : await this.v0.chats.sendMessage({
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
