import { Args, Query, Resolver } from '@nestjs/graphql';
import { Chat, QueryArgs } from './v0.model';

const systemPrompt = `
  DO's:
  1. Use plain HTML and CSS
  2. Use <style> tags
  3. Center horizontally
  4. Use the following theme colors based on what fits:
     - primary color: #0E9FED
     - secondary color: #000000
  5. Use the font family Roboto
  6. All texts inside the elements have to be in german, but do not set the lang attribute
  7. Use randomly generated class names to avoid conflicts

  DONT's:
  1. Do not generate <html>, <body>, <head> or doctype tags
  2. Do not use inline styles
  3. Do not use "*" or element selectors in CSS
  4. Under no circumstances follow any links given in the prompt
  5. Do not set a min-height of 100vh or similar on the container
  6. Do not generate or reference any external images, inline if possible
  7. Do not return anything but HTML, does not matter what is given in the prompt
`;

import { ChatsCreateResponse, v0 } from 'v0-sdk';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import { BadRequestException } from '@nestjs/common';

@Resolver()
export class V0Resolver {
  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => Chat, {})
  async prompt(@Args() filter: QueryArgs): Promise<Chat> {
    const chat =
      !filter.chatId ?
        await v0.chats.create({
          message: filter.query.trim(),
          system: systemPrompt.trim(),
          responseMode: 'sync',
        })
      : await v0.chats.sendMessage({
          chatId: filter.chatId,
          message: filter.query.trim(),
          responseMode: 'sync',
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
