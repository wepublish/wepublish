import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseJsonPipe
  implements PipeTransform<string, Record<string, unknown>>
{
  transform(
    value: string,
    metadata: ArgumentMetadata
  ): Record<string, unknown> {
    const propertyName = metadata.data;

    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException(`${propertyName} contains invalid JSON `);
    }
  }
}
