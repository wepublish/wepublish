import {Checkbox, FormControlLabel, FormGroup, css, styled} from '@mui/material'
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns'
import {ApiV1, EventListContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {Reducer, useReducer} from 'react'

const Filter = styled('div')`
  display: grid;
  grid-template-columns: minmax(150px, 250px);
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};
  margin-bottom: ${({theme}) => theme.spacing(3)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }
  `}

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: 250px 250px 250px;
    }
  `}
`

export default function EventList() {
  const [variables, onVariablesChange] = useReducer<
    Reducer<Partial<ApiV1.EventListQueryVariables>, Partial<ApiV1.EventListQueryVariables>>
  >(
    (state, newVariables) => ({
      ...state,
      ...newVariables
    }),
    {
      sort: ApiV1.EventSort.StartsAt,
      order: ApiV1.SortOrder.Ascending
    } as Partial<ApiV1.EventListQueryVariables>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Filter>
        <DateTimePicker
          label="Von"
          value={variables?.filter?.from ?? null}
          onChange={value => {
            onVariablesChange({
              filter: {
                ...variables?.filter,
                from: value
              }
            })
          }}
        />

        <DateTimePicker
          label="Von"
          value={variables?.filter?.to ?? null}
          onChange={value => {
            onVariablesChange({
              filter: {
                ...variables?.filter,
                to: value
              }
            })
          }}
        />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={variables?.filter?.upcomingOnly ?? false}
                onChange={(_, checked) => {
                  onVariablesChange({
                    filter: {
                      ...variables?.filter,
                      upcomingOnly: checked
                    }
                  })
                }}
              />
            }
            label="Nur bevorstehende"
          />
        </FormGroup>
      </Filter>

      <EventListContainer variables={variables} onVariablesChange={onVariablesChange} />
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
