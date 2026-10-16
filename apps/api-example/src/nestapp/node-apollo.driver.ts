import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';

export class NodeApolloDriver extends ApolloDriver {
  public override async registerServer(
    apolloOptions: ApolloDriverConfig
  ): Promise<void> {
    await (
      this as unknown as {
        registerExpress(options: ApolloDriverConfig): Promise<void>;
      }
    ).registerExpress(apolloOptions);
  }
}
