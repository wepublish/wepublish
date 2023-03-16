import {Query, Resolver} from '@nestjs/graphql'
import {VersionInformation} from './models/versionInformation.model'
import {version} from '../../../package.json'

@Resolver()
export class VersionInformationResolver {
  @Query(returns => VersionInformation, {name: 'versionInformation'})
  async getVersionInformation() {
    return {
      version
    }
  }
}
