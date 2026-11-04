import { bindComponent, formView } from '@wepublish/form/editor';

import { pollSchema } from './poll.schema';
import { PollAnswerRow, PollAnswers } from './pollAnswers';
import {
  ExternalVoteAmountRow,
  ExternalVoteAmounts,
  ExternalVoteSourceRow,
  ExternalVoteSources,
} from './pollExternalVotes';

export const pollView = formView(pollSchema, {
  paths: {
    list: '/polls',
    edit: id => `/polls/edit/${id}`,
  },
  sections: [
    {
      title: 'pollEditView.sections.general',
      fields: ['question', 'infoText'],
    },
    {
      title: 'pollEditView.sections.schedule',
      placement: 'aside',
      fields: ['opensAt', 'closedAt'],
    },
    {
      title: 'pollEditView.answerPanelHeader',
      description: 'pollAnswer.copyVoteUrlHint',
      fields: ['answers'],
    },
    {
      title: 'pollEditView.pollExternalVotesPanelHeader',
      description: 'pollEditView.pollExternalVotesInfo',
      fields: ['externalVoteSources'],
    },
  ],
  fields: {
    answers: { component: bindComponent(PollAnswers) },
    'answers.*': { layout: PollAnswerRow },
    externalVoteSources: { component: bindComponent(ExternalVoteSources) },
    'externalVoteSources.*': { layout: ExternalVoteSourceRow },
    'externalVoteSources.*.voteAmounts': {
      component: bindComponent(ExternalVoteAmounts),
    },
    'externalVoteSources.*.voteAmounts.*': { layout: ExternalVoteAmountRow },
  },
});
