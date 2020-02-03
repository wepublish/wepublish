export interface MutationHooks {
  create?: () => void
  update?: () => void
  delete?: () => void
}

export interface Hooks {
  readonly article?: MutationHooks
  readonly page?: MutationHooks
  readonly user?: MutationHooks
  readonly authors?: MutationHooks
}
