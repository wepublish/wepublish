import {Query, Resolver} from '@nestjs/graphql'
import {VersionInformation} from './models/versionInformation.model'
import {version} from '../../../package.json'
import {promises as fs} from 'fs'

@Resolver()
export class VersionInformationResolver {
  private versionString: string | undefined

  async onModuleInit() {
    try {
      const versionId = await fs.readFile('.version', 'utf-8')
      this.versionString = `${versionId.slice(0, 7)}`
    } catch (error) {
      this.versionString = `v${version}`
    }
  }

  @Query(returns => VersionInformation, {name: 'versionInformation'})
  async getVersionInformation() {
    return {
      version: this.versionString
    }
  }
}
