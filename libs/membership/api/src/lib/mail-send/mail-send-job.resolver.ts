import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MailSendJobModel, MailSendJobOutcome } from './mail-send.model';
import { MailSendJobOutcomeService } from './mail-send-job-outcome.service';

@Resolver(() => MailSendJobModel)
export class MailSendJobResolver {
  constructor(private outcomeService: MailSendJobOutcomeService) {}

  @ResolveField(() => MailSendJobOutcome)
  outcome(@Parent() { id }: MailSendJobModel) {
    return this.outcomeService.outcomeOf(id);
  }
}
