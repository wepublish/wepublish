import { Query, Resolver } from '@nestjs/graphql';
import { VersionInformation } from './versionInformation.model';
import { promises as fs } from 'fs';
import { Permissions } from '@wepublish/permissions/api';
import { CanLoginEditor } from '@wepublish/permissions';

@Resolver()
export class VersionInformationResolver {
  private versionString: string | undefined;

  async onModuleInit() {
    try {
      const versionId = await fs.readFile('.version', 'utf-8');
      this.versionString = `Deployed Version: ${versionId.slice(0, 7)}`;
    } catch (error) {
      this.versionString = `<!- VERSION UNKNOWN -!>`;
    }
  }

  @Permissions(CanLoginEditor)
  @Query(returns => VersionInformation, { name: 'versionInformation' })
  async getVersionInformation() {
    return {
      version: this.versionString,
    };
  }
}
