import {ArticleWrapper, useWebsiteBuilder} from '@wepublish/website'
import {Author} from '@wepublish/website/api'
import {useMemo} from 'react'
import {styled} from '@mui/material'
import {TsriRichText} from './tsri-richtext'

const TsriAdvertiserContainer = styled('div')`
  display: grid;
  width: 100%;
  border-bottom: solid 1px ${({theme}) => theme.palette.primary.main};
`
const TsriAdvertiserImgContainer = styled('div')``

const TsriAdvertiserContent = styled('div')``

const SPONSOR_TAG = 'sponsor'
const PROMO_TAG = 'promo'

function isPromo(author: Author): boolean {
  return !!author.tags?.find(tag => tag.tag === PROMO_TAG)
}

function isSponsor(author: Author): boolean {
  return !!author.tags?.find(tag => tag.tag === SPONSOR_TAG)
}

function getFirstLink(author: Author): string {
  const links = author.links
  return links?.length ? links[0].url : ''
}

export default function TsriAdHeader({authors}: {authors?: Author[]}) {
  const {
    elements: {Image, Link}
  } = useWebsiteBuilder()

  const advertisers: Author[] | undefined = useMemo(() => {
    return authors?.filter(author => isSponsor(author) || isPromo(author))
  }, [authors])

  return (
    <ArticleWrapper>
      {advertisers?.map(advertiser => (
        <TsriAdvertiserContainer key={advertiser.id}>
          {advertiser.image && (
            <TsriAdvertiserImgContainer>
              <Image image={advertiser.image} />
            </TsriAdvertiserImgContainer>
          )}

          <TsriAdvertiserContent>
            <Link href={getFirstLink(advertiser)} target={'_blank'}>
              {isPromo(advertiser) ? (
                <b>Rubrik Kultur wird präsentiert von: </b>
              ) : (
                <b>Präsentiert von</b>
              )}
              <TsriRichText richText={advertiser.bio || []} />
            </Link>
          </TsriAdvertiserContent>

          {advertiser.name}
        </TsriAdvertiserContainer>
      ))}
    </ArticleWrapper>
  )
}
