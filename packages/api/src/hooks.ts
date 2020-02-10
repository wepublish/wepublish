export interface MutationHooks {
  create?: () => void
  update?: () => void
  delete?: () => void
}

export interface PublishMutationHooks extends MutationHooks {
  publish?: () => void
}

export interface Hooks {
  readonly user?: MutationHooks
  readonly authors?: MutationHooks

  readonly article?: PublishMutationHooks
  readonly page?: PublishMutationHooks
}
