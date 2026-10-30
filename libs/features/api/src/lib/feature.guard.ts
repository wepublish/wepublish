import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_METADATA_KEY } from './feature.decorator';
import { FeaturesService } from './features.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private features: FeaturesService
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndMerge<string[]>(
      FEATURE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    for (const feature of required) {
      if (!(await this.features.isEnabled(feature))) {
        throw new ForbiddenException(
          `Feature "${feature}" is not enabled for this medium`
        );
      }
    }

    return true;
  }
}
