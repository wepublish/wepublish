import {css, styled} from '@mui/material'
import {BuilderAuthorChipProps, useWebsiteBuilder} from '@wepublish/website'

type BajourAuthorChipProps = Omit<BuilderAuthorChipProps, 'publishedAt'> & {
  publishedAt?: string | null | undefined
}

export const BajourAuthorChipWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export const BajourAuthorChipAuthorWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: end;
`

export const BajourAuthorChipMetaWrapper = styled('div')`
  display: grid;
  justify-content: space-between;
  align-items: center;
  span {
    font-weight: 300;
  }
`

export const BajourAuthorChipImageWrapper = styled('div')`
  display: grid;
  width: ${({theme}) => theme.spacing(10)};
  margin-left: ${({theme}) => `-${theme.spacing(5)}`};

  ${({theme}) => theme.breakpoints.up('md')} {
    width: ${({theme}) => theme.spacing(15)};
    margin-left: ${({theme}) => `-${theme.spacing(7.5)}`};
  }
`

export const BajourAuthorChipContentWrapper = styled('div')`
  display: grid;
`

export const BajourAuthorChipName = styled('div')`
  font-weight: 300;
  font-size: ${({theme}) => theme.typography.h4.fontSize};

  a {
    color: ${({theme}) => theme.palette.text.primary};
    text-decoration: none;
  }
`

const imageStyles = css`
  border-radius: 50%;
`

export function BajourAuthorChip({className, author}: BajourAuthorChipProps) {
  const {
    AuthorLinks,
    elements: {Image, Link},
    blocks: {RichText}
  } = useWebsiteBuilder()

  return (
    <BajourAuthorChipWrapper className={className}>
      {author.image && (
        <BajourAuthorChipImageWrapper>
          <Image image={author.image} square css={imageStyles} />
        </BajourAuthorChipImageWrapper>
      )}

      <BajourAuthorChipAuthorWrapper>
        <BajourAuthorChipContentWrapper>
          <BajourAuthorChipName>
            <Link href={author.url}>{author.name}</Link>
          </BajourAuthorChipName>
        </BajourAuthorChipContentWrapper>
      </BajourAuthorChipAuthorWrapper>

      <BajourAuthorChipMetaWrapper>
        {author.bio && <RichText richText={author.bio} />}
      </BajourAuthorChipMetaWrapper>
      <BajourAuthorChipMetaWrapper>
        {!!author.links?.length && <AuthorLinks links={author.links} />}
      </BajourAuthorChipMetaWrapper>
    </BajourAuthorChipWrapper>
  )
}
