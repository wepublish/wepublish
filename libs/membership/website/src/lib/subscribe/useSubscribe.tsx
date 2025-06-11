import {usePageLazyQuery} from '@wepublish/website/api'

export function useSubscribe() {
  // @TODO: Replace with objects on Memberplan when Memberplan has been migrated to V2
  // Pages are currently in V2 and Memberplan are in V1, so we have no access to page objects.
  const [fetchPage] = usePageLazyQuery()

  async function fetchRedirectPages({
    successPageId,
    failPageId
  }: {
    successPageId?: string | undefined | null
    failPageId?: string | undefined | null
  }) {
    return await Promise.all([
      fetchPage({
        variables: {
          id: successPageId
        }
      }),
      fetchPage({
        variables: {
          id: failPageId
        }
      })
    ])
  }

  return {
    fetchRedirectPages
  }
}
