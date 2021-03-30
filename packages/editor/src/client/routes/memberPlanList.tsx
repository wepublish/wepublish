import React, {useState, useEffect} from 'react'

import {
  FlexboxGrid,
  Icon,
  IconButton,
  Table,
  Modal,
  Button,
  InputGroup,
  Input,
  Popover,
  Whisper
} from 'rsuite'
import {useTranslation} from 'react-i18next'

import {
  Link,
  RouteType,
  useRoute,
  useRouteDispatch,
  MemberPlanEditRoute,
  MemberPlanCreateRoute,
  MemberPlanListRoute,
  ButtonLink
} from '../route'

import {RouteActionType} from '@karma.run/react'

import {FullMemberPlanFragment, useDeleteMemberPlanMutation, useMemberPlanListQuery} from '../api'
import {MemberPlanEditPanel} from '../panel/memberPlanEditPanel'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function MemberPlanList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const {t} = useTranslation()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.MemberPlanEdit || current?.type === RouteType.MemberPlanCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.MemberPlanEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentMemberPlan, setCurrentMemberPlan] = useState<FullMemberPlanFragment>()

  const {data, /* fetchMore, */ loading: isLoading} = useMemberPlanListQuery({
    variables: {
      filter: filter || undefined,
      first: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteMemberPlan, {loading: isDeleting}] = useDeleteMemberPlanMutation()

  const speaker = (
    <Popover title={t('memberPlanList.deleteModalTitle')}>
      <p>{t('userList.popover.popoverText')}</p>
      <p>
        <Button
          color="red"
          disabled={isDeleting}
          onClick={async () => {
            if (!currentMemberPlan) return

            await deleteMemberPlan({
              variables: {id: currentMemberPlan.id}
            })

            setConfirmationDialogOpen(false)
          }}>
          {t('userList.popover.deleteNow')}
        </Button>
      </p>
    </Popover>
  )

  useEffect(() => {
    switch (current?.type) {
      case RouteType.MemberPlanCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.MemberPlanEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  useEffect(() => {
    if (data?.memberPlans?.nodes) {
      setMemberPlans(data.memberPlans.nodes)
    }
  }, [data?.memberPlans])

  /* function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.memberPlans.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          memberPlans: {
            ...fetchMoreResult.memberPlans,
            nodes: [...prev.memberPlans.nodes, ...fetchMoreResult?.memberPlans.nodes]
          }
        }
      }
    })
  } */

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('memberPlanList.title')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={MemberPlanCreateRoute.create({})}>
            {t('memberPlanList.createNew')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
            <Input value={filter} onChange={value => setFilter(value)} />
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={memberPlans}>
        <Column flexGrow={2} align="left">
          <HeaderCell>{t('memberPlanList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullMemberPlanFragment) => (
              <Link route={MemberPlanEditRoute.create({id: rowData.id})}>
                {rowData.name || t('untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={60} align="right" fixed="right">
          <HeaderCell>{t('memberPlanList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullMemberPlanFragment) => (
              <>
                <Whisper placement="leftEnd" trigger="click" speaker={speaker}>
                  <IconButton
                    icon={<Icon icon="trash-o" />}
                    circle
                    size="sm"
                    color="red"
                    onClick={() => {
                      setCurrentMemberPlan(rowData)
                    }}
                  />
                </Whisper>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Modal
        show={isEditModalOpen}
        size={'lg'}
        onHide={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: MemberPlanListRoute.create({}, current ?? undefined)
          })
        }}>
        <MemberPlanEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: MemberPlanListRoute.create({}, current ?? undefined)
            })
          }}
          onSave={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: MemberPlanListRoute.create({}, current ?? undefined)
            })
          }}
        />
      </Modal>
    </>
  )
}
