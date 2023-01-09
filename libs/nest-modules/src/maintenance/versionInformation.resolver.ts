import {Query, Resolver} from '@nestjs/graphql'
import {VersionInformation} from './models/versionInformation.model'
import * as lerna from '/lerna.json'

@Resolver(of => VersionInformation)
export class VersionInformationResolver {
  @Query(returns => VersionInformation, {name: 'versionInformation'})
  async getVersionInformation() {
    return {
      version: lerna.version
    }
  }
}
