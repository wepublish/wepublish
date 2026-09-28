import { Args, Query, Resolver } from '@nestjs/graphql';
import { Chat, PromptHTMLArgs } from './v0.model';
import { ChatsCreateResponse } from 'v0-sdk';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import { BadRequestException } from '@nestjs/common';
import { V0ClientService } from './v0-client.service';

@Resolver()
export class V0Resolver {
  constructor(private v0Client: V0ClientService) {}

  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => Chat)
  async promptHTML(@Args() { query, chatId }: PromptHTMLArgs): Promise<Chat> {
    const v0 = await this.v0Client.getClient();
    const systemPrompt = await this.v0Client.getSystemPrompt();

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
