import { Field, Float, ObjectType } from '@nestjs/graphql';
import { hostname } from 'os';

@ObjectType({
  description: `Memory and uptime of the API process that answers. Load tests read it while the periodic job runs: a new hostname or a smaller uptime means the pod restarted.`,
})
export class ApiProcessStats {
  @Field({ description: `The pod's name.` })
  hostname!: string;

  @Field(() => Float)
  uptimeSeconds!: number;

  @Field(() => Float, {
    description: `Resident memory, the number the pod's memory limit is about.`,
  })
  rssBytes!: number;

  @Field(() => Float)
  heapUsedBytes!: number;

  @Field(() => Float, {
    description: `Memory outside the V8 heap, e.g. the buffers of pdfs and attachments.`,
  })
  externalBytes!: number;
}

export const currentProcessStats = (): ApiProcessStats => {
  const { rss, heapUsed, external } = process.memoryUsage();

  return {
    hostname: hostname(),
    uptimeSeconds: process.uptime(),
    rssBytes: rss,
    heapUsedBytes: heapUsed,
    externalBytes: external,
  };
};
