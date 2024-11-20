import {BannerDocumentType, usePrimaryBannerQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

export type BannerContainerProps = {
  documentType: BannerDocumentType
  documentId?: string
} & BuilderContainerProps

export function BannerContainer({documentType, documentId, className}: BannerContainerProps) {
  const {Banner} = useWebsiteBuilder()

  const {data, loading, error} = usePrimaryBannerQuery({
    variables: {
      documentId: documentId ?? '',
      documentType
    }
  })

  return <Banner data={data} loading={loading} error={error} className={className} />
}
