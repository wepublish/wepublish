import styled from '@emotion/styled';
import {
  FullUserRoleFragment,
  PollAnswerWithVoteCount,
  TagType,
  usePollLazyQuery,
  UserFilter,
} from '@wepublish/editor/api';
import {
  ArticleFilter,
  DateFilterComparison,
  EventFilter,
  FullAuthorFragment,
  getApiClientV2,
  InputMaybe,
  PageFilter,
  PeerArticleFilter,
  PollVoteFilter,
  Scalars,
  useEventProvidersLazyQuery,
  usePeerListLazyQuery,
  useUserRoleListLazyQuery,
} from '@wepublish/editor/api-v2';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import {
  Button,
  CheckPicker as RCheckPicker,
  DateRangePicker,
  Form as RForm,
  Input,
  SelectPicker as RSelectPicker,
  Toggle as RToggle,
} from 'rsuite';

import { SelectTags } from '../atoms/tag/selectTags';
import { AuthorCheckPicker } from '../panel/authorCheckPicker';

const { Group } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-wrap: wrap;
  margin-top: 15px;
`;

const CloseIcon = styled(MdClose)`
  margin-right: 5px;
`;

const SelectPicker = styled(RSelectPicker)`
  width: 150px;
`;

const CheckPicker = styled(RCheckPicker)`
  width: 200px;
`;

const Toggle = styled(RToggle)`
  display: inline-block;
  margin-top: 6px;
`;

const FormGroup = styled(Group)`
  width: 100%;
`;

const WideInput = styled(Input)`
  width: 400px;
`;

const formInputStyle = {
  marginRight: '15px',
  marginTop: '0',
  marginBottom: '10px',
};

type Field =
  | 'title'
  | 'preTitle'
  | 'lead'
  | 'description'
  | 'draft'
  | 'published'
  | 'pending'
  | 'authors'
  | 'peerId'
  | 'publicationDate'
  | 'dates'
  | 'providers'
  | 'userRole'
  | 'text'
  | 'name'
  | 'location'
  | 'includeHidden'
  | 'answerIds'
  | 'fingerprint'
  | 'tags';

export type ImportableEventFilter = {
  startsAt?: InputMaybe<Scalars['String']>;
  endsAt?: InputMaybe<Scalars['String']>;
  providers?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

type Filter = ArticleFilter &
  PeerArticleFilter &
  PageFilter &
  UserFilter &
  EventFilter &
  ImportableEventFilter &
  PollVoteFilter;

export interface ListViewFiltersProps {
  fields: Field[];
  filter: Partial<Filter>;
  isLoading: boolean;
  onSetFilter(filter: Filter): void;
  className?: string;
  tagType?: TagType;
}

export function ListViewFilters({
  fields,
  filter,
  onSetFilter,
  className,
  tagType,
}: ListViewFiltersProps) {
  const client = getApiClientV2();
  const { t } = useTranslation();
  const [resetFilterKey, setResetFilterkey] = useState<string>(
    new Date().getTime().toString()
  );
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([]);
  const [answers, setAnswers] = useState<PollAnswerWithVoteCount[]>([]);

  const [providersFetch, { data: providersData }] = useEventProvidersLazyQuery({
    client,
    fetchPolicy: 'network-only',
  });

  const [userRoleFetch, { data: userRoleData }] = useUserRoleListLazyQuery({
    client,
    fetchPolicy: 'network-only',
    variables: {
      take: 200,
    },
  });

  const [peerListFetch, { data: peerListData }] = usePeerListLazyQuery({
    client,
    fetchPolicy: 'network-only',
  });

  const [pollFetch, { data: pollData }] = usePollLazyQuery({
    fetchPolicy: 'network-only',
  });

  // check whether or not we need to get some data based on which filters are required
  const isAnswerFilter = fields.includes('answerIds');
  const isProviderFilter = fields.includes('providers');
  const isUserRoleFilter = fields.includes('userRole');
  const isPeerFilter = fields.includes('peerId');

  // conditionally get some additional data
  useEffect(() => {
    if (isPeerFilter) {
      peerListFetch();
    }
  }, [isPeerFilter, peerListFetch]);

  useEffect(() => {
    if (isUserRoleFilter) {
      userRoleFetch();
    }
  }, [isUserRoleFilter, userRoleFetch]);

  useEffect(() => {
    if (isProviderFilter) {
      providersFetch();
    }
  }, [isProviderFilter, providersFetch]);

  useEffect(() => {
    if (isAnswerFilter && filter.pollId) {
      pollFetch({
        variables: {
          pollId: filter.pollId,
        },
      });
    }
  }, [isAnswerFilter, pollFetch, filter]);

  /**
   * Setup user roles, whenever user role data object changes
   */
  useEffect(() => {
    if (userRoleData?.userRoles?.nodes) {
      setUserRoles(userRoleData.userRoles.nodes);
    }
  }, [userRoleData?.userRoles]);

  /**
   * Setup poll
   */
  useEffect(() => {
    if (pollData?.poll?.answers) {
      setAnswers(pollData?.poll?.answers);
    }
  }, [pollData?.poll?.answers]);

  const allPeers = peerListData?.peers;

  /**
   * helper functions to manage filter
   */
  function isAnyFilterSet(): boolean {
    for (const [filterKey, filterValue] of Object.entries(filter)) {
      if (
        filterKey &&
        fields.includes(
          mapFilterFieldToField(filterKey as keyof Filter) as Field
        ) &&
        filterValue
      ) {
        return true;
      }
    }
    return false;
  }

  function mapFilterFieldToField(name: keyof Filter): Field | null {
    if (name === 'from' || name === 'to') {
      return 'dates';
    } else if (fields.includes(name as Field)) {
      return name as Field;
    } else {
      return null;
    }
  }

  function resetFilter(): void {
    const cleanFilter: Record<string, any> = {};

    for (const filterKey in filter) {
      const possibleField = mapFilterFieldToField(filterKey as keyof Filter);

      if (!possibleField || !fields.includes(possibleField)) {
        cleanFilter[filterKey] = filter[filterKey as keyof Filter];
      }
    }

    onSetFilter(cleanFilter);
    setResetFilterkey(new Date().getTime().toString());
  }

  const updateFilter = (value: Partial<Filter>) => {
    if (value.authors && !value.authors.length) {
      value = { authors: null };
    }

    if (value.userRole && !value.userRole.length) {
      value = { userRole: null };
    }

    if (value.answerIds && !value.answerIds.length) {
      value = { answerIds: null };
    }

    const newFilter = {
      ...filter,
      ...value,
    };
    onSetFilter(newFilter);
  };

  /**
   * UI helper functions
   */
  function resetFilterView() {
    if (!isAnyFilterSet()) {
      return null;
    }

    return (
      <FormGroup>
        <Button
          onClick={() => resetFilter()}
          color="red"
          appearance="ghost"
        >
          <CloseIcon />
          {t('filterableList.filter.reset')}
        </Button>
      </FormGroup>
    );
  }

  const authorsData = filter?.authors?.map(author => ({ id: author })) || [];
  return (
    <>
      <Form className={className}>
        {fields.includes('text') && (
          <Group style={formInputStyle}>
            <WideInput
              value={filter.text || ''}
              placeholder={t('subscriptionList.filter.searchPlaceholder')}
              onChange={value => updateFilter({ text: value })}
            />
          </Group>
        )}

        {fields.includes('userRole') && (
          <Group style={formInputStyle}>
            <CheckPicker
              data-testid="userRole-combobox"
              name="userRoles"
              block
              value={filter?.userRole || []}
              data={userRoles.map(userRole => ({
                value: userRole.id,
                label: userRole.name,
              }))}
              placement="auto"
              onChange={value => {
                updateFilter({
                  userRole:
                    userRoles
                      .filter(userRole => value.includes(userRole.id))
                      .map(r => r.id) || null,
                });
              }}
              onClean={() => {
                onSetFilter({ userRole: [] });
              }}
              placeholder={t('userCreateOrEditView.userRoles')}
            />
          </Group>
        )}

        {fields.includes('answerIds') && (
          <Group style={formInputStyle}>
            <CheckPicker
              data-testid="answerIds-combobox"
              name="answerIds"
              block
              value={filter?.answerIds || []}
              data={answers.map(answer => ({
                value: answer.id,
                label: answer.answer,
              }))}
              placement="auto"
              onChange={value => {
                updateFilter({
                  answerIds:
                    answers
                      .filter(answer => value.includes(answer.id))
                      .map(r => r.id) || null,
                });
              }}
              placeholder={t('pollVoteList.answerId')}
            />
          </Group>
        )}

        {fields.includes('title') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.title || ''}
              placeholder={t('filterableList.filter.title')}
              onChange={value => updateFilter({ title: value })}
            />
          </Group>
        )}

        {fields.includes('description') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.description || ''}
              placeholder={t('filterableList.filter.description')}
              onChange={value => updateFilter({ description: value })}
            />
          </Group>
        )}

        {fields.includes('preTitle') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.preTitle || ''}
              placeholder={t('filterableList.filter.preTitle')}
              onChange={value => updateFilter({ preTitle: value })}
            />
          </Group>
        )}

        {fields.includes('lead') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.lead || ''}
              placeholder={t('filterableList.filter.lead')}
              onChange={value => updateFilter({ lead: value })}
            />
          </Group>
        )}

        {fields.includes('fingerprint') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.fingerprint || ''}
              placeholder={t('pollVoteList.fingerprint')}
              onChange={value => updateFilter({ fingerprint: value })}
            />
          </Group>
        )}

        {fields.includes('name') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.name || ''}
              placeholder={t('filterableList.filter.name')}
              onChange={value => updateFilter({ name: value })}
            />
          </Group>
        )}

        {fields.includes('location') && (
          <Group style={formInputStyle}>
            <Input
              value={filter.location || ''}
              placeholder={t('filterableList.filter.location')}
              onChange={value => updateFilter({ location: value })}
            />
          </Group>
        )}

        {fields.includes('authors') && (
          <Group style={formInputStyle}>
            <AuthorCheckPicker
              list={authorsData as FullAuthorFragment[]}
              onChange={value => {
                return updateFilter({
                  authors: value ? value.map(author => author.id) : [],
                });
              }}
            />
          </Group>
        )}

        {fields.includes('tags') && (
          <Group style={formInputStyle}>
            <SelectTags
              defaultTags={[]}
              tagType={tagType ?? TagType.Article}
              setSelectedTags={tags => updateFilter({ tags })}
              placeholder={t('navbar.articleTags')}
            />
          </Group>
        )}

        {fields.includes('providers') && (
          <Group style={formInputStyle}>
            <CheckPicker
              disabled={false}
              searchable={false}
              virtualized
              cleanable
              value={filter.providers || []}
              data={
                providersData ?
                  providersData?.eventProviders.map(provider => ({
                    value: provider,
                    label: provider,
                  }))
                : [{ value: undefined, label: undefined }]
              }
              placeholder={t('filterableList.filter.providers')}
              onChange={providers => {
                updateFilter({
                  providers:
                    providers.length ?
                      (providers.filter(p => p !== '') as string[])
                    : undefined,
                });
              }}
              block
            />
          </Group>
        )}

        {fields.includes('draft') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.draft}
              checked={!!filter.draft}
              onChange={value => updateFilter({ draft: value || null })}
              checkedChildren={t('filterableList.filter.isDraft')}
              unCheckedChildren={t('filterableList.filter.isDraft')}
            />
          </Group>
        )}

        {fields.includes('pending') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.pending}
              checked={!!filter.pending}
              onChange={value => updateFilter({ pending: value || null })}
              checkedChildren={t('filterableList.filter.isPending')}
              unCheckedChildren={t('filterableList.filter.isPending')}
            />
          </Group>
        )}

        {fields.includes('published') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.published}
              checked={!!filter.published}
              onChange={value => updateFilter({ published: value || null })}
              checkedChildren={t('filterableList.filter.isPublished')}
              unCheckedChildren={t('filterableList.filter.isPublished')}
            />
          </Group>
        )}

        {fields.includes('publicationDate') && (
          <Group style={formInputStyle}>
            <DateRangePicker
              key={`publication-date-${resetFilterKey}`}
              placeholder={t('filterableList.filter.publicationDate')}
              block
              placement="auto"
              onChange={value => {
                if (value && value[0] && value[1]) {
                  updateFilter({
                    publicationDateFrom: {
                      date: value[0]?.toISOString(),
                      comparison: DateFilterComparison.GreaterThan,
                    },
                    publicationDateTo: {
                      date: value[1]?.toISOString(),
                      comparison: DateFilterComparison.LowerThanOrEqual,
                    },
                  });
                }
              }}
              onClean={() =>
                updateFilter({
                  publicationDateFrom: undefined,
                  publicationDateTo: undefined,
                })
              }
            />
          </Group>
        )}

        {fields.includes('dates') && (
          <Group style={formInputStyle}>
            <DateRangePicker
              key={`dates-${resetFilterKey}`}
              placeholder={t('filterableList.filter.dates')}
              block
              placement="auto"
              onChange={value => {
                if (value && value[0] && value[1]) {
                  const [from, to] = value;
                  from.setHours(0);
                  from.setMinutes(0);
                  from.setSeconds(0);
                  from.setMilliseconds(0);
                  to.setHours(23);
                  to.setMinutes(59);
                  to.setSeconds(59);
                  to.setMilliseconds(999);
                  updateFilter({
                    from: from.toISOString(),
                    to: to.toISOString(),
                  });
                }
              }}
              onClean={() => updateFilter({ from: undefined, to: undefined })}
            />
          </Group>
        )}

        {isPeerFilter && !!allPeers && (
          <Group style={formInputStyle}>
            <SelectPicker
              virtualized
              value={filter.peerId ?? null}
              data={allPeers.map(peer => ({
                value: peer.id,
                label: peer.name,
              }))}
              placeholder={t('peerArticles.filterByPeer')}
              searchable
              onSelect={value => updateFilter({ peerId: value })}
              onClean={() => updateFilter({ peerId: undefined })}
            />
          </Group>
        )}

        {fields.includes('includeHidden') && (
          <Group style={formInputStyle}>
            <Toggle
              defaultChecked={!!filter.includeHidden}
              checked={!!filter.includeHidden}
              onChange={value => updateFilter({ includeHidden: value || null })}
              checkedChildren={
                tagType === TagType.Article ?
                  t('filterableList.filter.includeHiddenArticles')
                : tagType === TagType.Page ?
                  t('filterableList.filter.includeHiddenPages')
                : t('filterableList.filter.includeHiddenArticles')
              }
              unCheckedChildren={
                tagType === TagType.Article ?
                  t('filterableList.filter.includeHiddenArticles')
                : tagType === TagType.Page ?
                  t('filterableList.filter.includeHiddenPages')
                : t('filterableList.filter.includeHiddenArticles')
              }
            />
          </Group>
        )}
      </Form>
      {resetFilterView()}
    </>
  );
}
