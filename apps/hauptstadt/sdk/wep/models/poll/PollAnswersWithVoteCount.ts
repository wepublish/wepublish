import PollAnswerWithVoteCount from '~/sdk/wep/models/poll/PollAnswerWithVoteCount'

export default class PollAnswersWithVoteCount {
  answers: PollAnswerWithVoteCount[]

  constructor() {
    this.answers = []
  }

  parse(answers: PollAnswerWithVoteCount[]): PollAnswersWithVoteCount {
    this.answers = []
    for (const rawAnswer of answers) {
      this.answers.push(new PollAnswerWithVoteCount(rawAnswer))
    }
    return this
  }
}
