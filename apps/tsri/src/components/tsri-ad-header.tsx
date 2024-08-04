import {ArticleWrapper, Image} from '@wepublish/website'
import {Author} from '@wepublish/website/api'
import {useMemo} from 'react'
import {styled} from '@mui/material'
import {TsriRichText} from './tsri-richtext'
import {Link} from '@wepublish/ui'

const TsriAdvertiserContainer = styled(Link)`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: center;
  border-bottom: solid 1px ${({theme}) => theme.palette.primary.main};
  text-decoration: none;
  color: ${({theme}) => theme.palette.common.black};
`
const TsriAdvertiserImgContainer = styled('div')`
  padding-bottom: ${({theme}) => theme.spacing(1)};
  padding-top: ${({theme}) => theme.spacing(1)};
`

const AdImage = styled(Image)`
  max-height: 100px;
  max-width: 100px;

  ${({theme}) => theme.breakpoints.up('md')} {
    max-height: 120px;
    max-width: 120px;
  }
`

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
  const advertisers: Author[] | undefined = useMemo(() => {
    return authors?.filter(author => isSponsor(author) || isPromo(author))
  }, [authors])

  return (
    <ArticleWrapper>
      {advertisers?.map(advertiser => (
        <TsriAdvertiserContainer
          key={advertiser.id}
          href={getFirstLink(advertiser)}
          target={'_blank'}>
          {advertiser.image && (
            <TsriAdvertiserImgContainer>
              <AdImage image={advertiser.image} />
            </TsriAdvertiserImgContainer>
          )}

          <TsriAdvertiserContent>
            {isPromo(advertiser) ? (
              <b>Rubrik Kultur wird präsentiert von: </b>
            ) : (
              <b>Präsentiert von:</b>
            )}
            <TsriRichText richText={advertiser.bio || []} />
          </TsriAdvertiserContent>
        </TsriAdvertiserContainer>
      ))}
    </ArticleWrapper>
  )
}
