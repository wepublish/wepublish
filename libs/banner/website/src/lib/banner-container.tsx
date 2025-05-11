import {BannerDocumentType, usePrimaryBannerQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useUser} from '@wepublish/authentication/website'

export type BannerContainerProps = {
  documentType: BannerDocumentType
  documentId?: string
} & BuilderContainerProps

export function BannerContainer({documentType, documentId, className}: BannerContainerProps) {
  const {Banner} = useWebsiteBuilder()
  const {hasUser} = useUser()

  const {data, loading, error} = usePrimaryBannerQuery({
    variables: {
      documentId: documentId ?? '',
      documentType,
      loggedIn: hasUser
    }
  })

  return <Banner data={data} loading={loading} error={error} className={className} />
}
