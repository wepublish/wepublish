import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';

export class NodeApolloDriver extends ApolloDriver {
  override async registerServer(
    apolloOptions: ApolloDriverConfig
  ): Promise<void> {
    await this.registerExpress(apolloOptions);
  }
}
