import {Checkbox, FormControlLabel, FormGroup, styled} from '@mui/material'
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns'
import {ApiV1, EventListContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import {z} from 'zod'

const Filter = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, 250px);
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};
  margin-bottom: ${({theme}) => theme.spacing(3)};
`

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  upcomingOnly: z
    .string()
    .toLowerCase()
    .transform(string => JSON.parse(string))
    .pipe(z.boolean())
    .optional()
    .default('true'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
})

const take = 25

export default function EventList() {
  const {query, replace} = useRouter()
  const {page, upcomingOnly, from, to} = pageSchema.parse(query)

  const {
    elements: {Pagination}
  } = useWebsiteBuilder()

  const variables = useMemo(
    () =>
      ({
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: {
          from: from?.toISOString(),
          to: to?.toISOString(),
          upcomingOnly
        },
        sort: ApiV1.EventSort.StartsAt,
        order: ApiV1.SortOrder.Ascending
      } satisfies Partial<ApiV1.EventListQueryVariables>),
    [from, page, to, upcomingOnly]
  )

  const {data} = ApiV1.useEventListQuery({
    fetchPolicy: 'cache-only',
    variables
  })

  const pageCount = useMemo(() => {
    if (data?.events?.totalCount && data?.events?.totalCount > take) {
      return Math.ceil(data.events.totalCount / take)
    }

    return 1
  }, [data?.events?.totalCount])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Filter>
        <DateTimePicker
          label="Von"
          value={from ?? null}
          onChange={value => {
            replace(
              {
                query: {...query, from: value?.toISOString()}
              },
              undefined,
              {shallow: true, scroll: true}
            )
          }}
        />

        <DateTimePicker
          label="Bis"
          value={to ?? null}
          onChange={value => {
            replace(
              {
                query: {...query, to: value?.toISOString()}
              },
              undefined,
              {shallow: true, scroll: true}
            )
          }}
        />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={upcomingOnly ?? false}
                onChange={(_, checked) => {
                  replace(
                    {
                      query: {...query, upcomingOnly: checked}
                    },
                    undefined,
                    {shallow: true, scroll: true}
                  )
                }}
              />
            }
            label="Nur bevorstehende"
          />
        </FormGroup>
      </Filter>

      <EventListContainer variables={variables} />

      {pageCount > 1 && (
        <Pagination
          page={page ?? 1}
          count={pageCount}
          onChange={(_, value) =>
            replace(
              {
                query: {...query, page: value}
              },
              undefined,
              {shallow: true, scroll: true}
            )
          }
        />
      )}
    </LocalizationProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: ApiV1.EventListDocument,
      variables: {
        take,
        skip: 0,
        sort: ApiV1.EventSort.StartsAt,
        order: ApiV1.SortOrder.Ascending
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
