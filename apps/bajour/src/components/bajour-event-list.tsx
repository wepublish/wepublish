import {Chip, Theme, css, styled, useTheme} from '@mui/material'
import {
  ApiV1,
  BuilderEventListProps,
  EventListContainer,
  EventListItem,
  WebsiteBuilderProvider,
  useWebsiteBuilder
} from '@wepublish/website'
import {transparentize} from 'polished'

const TwoColumnList = styled(EventListContainer)`
  gap: 0;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(2, 1fr);
    }

    ${theme.breakpoints.up('lg')} {
      grid-template-columns: repeat(3, 1fr);
    }
  `}
`

const OneColumnItemWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  border-right: 1px solid ${({theme}) => theme.palette.secondary.main};
  border-bottom: 1px solid ${({theme}) => theme.palette.secondary.main};
  padding: ${({theme}) => theme.spacing(4)};
  position: relative;

  &:nth-of-type(3n + 3) {
    border-right: 0;
  }

  &::after {
    content: '';
    transition: opacity 200ms ease 0s, transform 200ms ease 0s;
    background: ${({theme}) =>
      `linear-gradient(rgba(0,0,0,0) 0%, ${transparentize(
        0.55,
        theme.palette.secondary.light
      )} 100%)`};
    height: 40%;
    pointer-events: none;
    z-index: -1;
    width: 100%;
    bottom: 0;
    position: absolute;
    opacity: 0;
  }

  &:hover::after {
    opacity: 1;
  }
`

const oneColumnItemStyles = (theme: Theme) => css`
  ${theme.breakpoints.up('md')} {
    grid-template-columns: 1fr;
  }
`

const Tags = styled('div')`
  display: flex;
  gap: ${({theme}) => theme.spacing(1)};
  justify-content: center;
`

const tagStyles = (theme: Theme) => css`
  background-color: ${theme.palette.common.white};
  border: 1px solid ${theme.palette.common.black};
  color: ${theme.palette.common.black};
  transition: background-color 200ms ease;
  text-decoration: none;

  &:hover {
    background-color: ${theme.palette.common.black};
    color: ${theme.palette.common.white};
  }
`

const OneColumnItem = (props: ApiV1.Event) => {
  const theme = useTheme()
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <OneColumnItemWrapper>
      <EventListItem css={oneColumnItemStyles(theme)} {...props} />

      {!!props.tags?.length && (
        <Tags>
          {props.tags.map(tag => (
            <Chip
              key={tag.id}
              label={tag.tag}
              css={tagStyles(theme)}
              component={Link}
              href={`/events/tag/${tag.id}`}
              clickable
            />
          ))}
        </Tags>
      )}
    </OneColumnItemWrapper>
  )
}

type BajourEventListProps = Pick<
  BuilderEventListProps,
  'className' | 'onVariablesChange' | 'variables'
>

export function BajourEventList({className, variables, onVariablesChange}: BajourEventListProps) {
  return (
    <WebsiteBuilderProvider EventListItem={OneColumnItem}>
      <TwoColumnList
        className={className}
        onVariablesChange={onVariablesChange}
        variables={variables}
      />
    </WebsiteBuilderProvider>
  )
}
