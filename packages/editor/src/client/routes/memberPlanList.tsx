import React, {useState, useEffect} from 'react'
import {
  Typography,
  Box,
  Spacing,
  Divider,
  Avatar,
  PlaceholderImage,
  Drawer,
  Image,
  SearchInput,
  OptionButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  Button
} from '@karma.run/ui'

import {
  RouteLinkButton,
  Link,
  RouteType,
  useRoute,
  useRouteDispatch,
  MemberPlanEditRoute,
  MemberPlanCreateRoute,
  MemberPlanListRoute
} from '../route'

import {RouteActionType} from '@karma.run/react'
import {MaterialIconDeleteOutlined, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'
import {FullMemberPlanFragment, useDeleteMemberPlanMutation, useMemberPlanListQuery} from '../api'
import {MemberPlanEditPanel} from '../panel/memberPlanEditPanel'

enum ConfirmAction {
  Delete = 'delete'
}

export function MemberPlanList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.MemberPlanEdit || current?.type === RouteType.MemberPlanCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.MemberPlanEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentMemberPlan, setCurrentMemberPlan] = useState<FullMemberPlanFragment>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const {data, fetchMore, loading: isLoading} = useMemberPlanListQuery({
    variables: {
      filter: filter || undefined,
      first: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteMemberPlan, {loading: isDeleting}] = useDeleteMemberPlanMutation()

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

  function loadMore() {
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
  }

  const memberPlans = data?.memberPlans.nodes.map(memberPlan => {
    const {id, label, image} = memberPlan

    return (
      <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
        <Box
          key={id}
          marginBottom={Spacing.ExtraSmall}
          display="flex"
          flexDirection="row"
          alignItems="center">
          <Avatar width={50} height={50} marginRight={Spacing.Small}>
            {image ? (
              image.squareURL && <Image src={image.squareURL} width="100%" height="100%" />
            ) : (
              <PlaceholderImage width="100%" height="100%" />
            )}
          </Avatar>

          <Link route={MemberPlanEditRoute.create({id})}>
            <Typography variant="h3" color={label ? 'dark' : 'gray'}>
              {label || 'Unknown'}
            </Typography>
          </Link>

          <Box flexGrow={1} />
          <OptionButton
            position="left"
            menuItems={[
              {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
            ]}
            onMenuItemClick={item => {
              setCurrentMemberPlan(memberPlan)
              setConfirmationDialogOpen(true)
              setConfirmAction(item.id as ConfirmAction)
            }}
          />
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">Member Plans</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label="New Member Plan"
          route={MemberPlanCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {memberPlans?.length ? (
          <>
            {memberPlans}
            <Box display="flex" justifyContent="center">
              {data?.memberPlans.pageInfo.hasNextPage && (
                <Button label="Load More" onClick={loadMore} />
              )}
            </Box>
          </>
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Member Plans found
          </Typography>
        ) : null}
      </Box>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
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
        )}
      </Drawer>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete Member Plan?"
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!currentMemberPlan) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteMemberPlan({
                          variables: {id: currentMemberPlan.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Name">
                  {currentMemberPlan?.label || 'Unknown'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
