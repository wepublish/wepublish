import { useLazyQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import {
  ArticleFilter,
  DateFilterComparison,
  FullAuthorFragment,
  PageFilter,
  PeerArticleFilter,
  PeerListDocument,
  PollDocument,
  PollVoteFilter,
  TagType,
  UserFilter,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DateRangeFilter } from '../atoms/dateRangeFilter';
import { SelectTags } from '../atoms/tag/selectTags';
import { AuthorCheckPicker } from '../panel/authorCheckPicker';
import { MultiSelectFilter } from './multi-select-filter';

const Form = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  gap: 12px;

  > * {
    min-width: 180px;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const WideInput = styled(TextField)`
  width: 400px;
`;

const StateFilter = styled(MultiSelectFilter<PublicationState>)`
  min-width: 260px;
`;

const publicationStateFields = ['draft', 'pending', 'published'] as const;

type PublicationState = (typeof publicationStateFields)[number];

const publicationStateLabels: Record<PublicationState, string> = {
  draft: 'filterableList.filter.isDraft',
  pending: 'filterableList.filter.isPending',
  published: 'filterableList.filter.isPublished',
};

const publicationStateChipSx: Record<PublicationState, object> = {
  draft: {
    backgroundColor: 'var(--wep-state-draft)',
    color: 'var(--wep-state-draft-text)',
  },
  pending: {
    backgroundColor: 'var(--wep-state-pending)',
    color: 'var(--wep-state-pending-text)',
  },
  published: {
    backgroundColor: 'var(--wep-state-published)',
    color: 'var(--wep-state-published-text)',
  },
};

type Field =
  | 'title'
  | 'preTitle'
  | 'lead'
  | 'description'
  | 'slug'
  | 'draft'
  | 'published'
  | 'pending'
  | 'authors'
  | 'peerId'
  | 'publicationDate'
  | 'dates'
  | 'userRole'
  | 'text'
  | 'name'
  | 'includeHidden'
  | 'answerIds'
  | 'fingerprint'
  | 'tags';

type Filter = ArticleFilter &
  PeerArticleFilter &
  PageFilter &
  UserFilter &
  PollVoteFilter;

export interface ListViewFiltersProps {
  fields: readonly Field[];
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
  const { t } = useTranslation();
  const [userRoleFetch, { data: userRoleData }] =
    useLazyQuery(UserRoleListDocument);

  const userRoles = userRoleData?.userRoles?.nodes ?? [];

  const [peerListFetch, { data: peerListData }] = useLazyQuery(
    PeerListDocument,
    {}
  );

  const [pollFetch, { data: pollData }] = useLazyQuery(PollDocument, {});

  // check whether or not we need to get some data based on which filters are required
  const isAnswerFilter = fields.includes('answerIds');
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
      userRoleFetch({
        variables: {
          take: 200,
        },
      });
    }
  }, [isUserRoleFilter, userRoleFetch]);

  useEffect(() => {
    if (isAnswerFilter && filter.pollId) {
      pollFetch({
        variables: {
          id: filter.pollId,
        },
      });
    }
  }, [isAnswerFilter, pollFetch, filter]);

  const answers = pollData?.poll?.answers ?? [];
  const allPeers = peerListData?.peers;

  /**
   * helper functions to manage filter
   */
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

    if (value.tags && !value.tags.length) {
      value = { tags: null };
    }

    const newFilter = {
      ...filter,
      ...value,
    };

    onSetFilter(newFilter);
  };

  const authorsData = filter?.authors?.map(author => ({ id: author })) || [];

  const publicationStates = publicationStateFields.filter(state =>
    fields.includes(state)
  );
  const setStates = publicationStates.filter(state => !!filter[state]);
  const pickedStates = setStates.length ? setStates : publicationStates;

  return (
    <Form className={className}>
      {fields.includes('text') && (
        <div>
          <WideInput
            value={filter.text || ''}
            placeholder={t('subscriptionList.filter.searchPlaceholder')}
            onChange={event => updateFilter({ text: event.target.value })}
          />
        </div>
      )}

      {fields.includes('userRole') && (
        <div>
          <MultiSelectFilter
            data-testid="userRole-combobox"
            label={t('userCreateOrEditView.userRoles')}
            options={userRoles.map(userRole => ({
              value: userRole.id,
              label: userRole.name,
            }))}
            value={filter?.userRole ?? []}
            onChange={userRole => updateFilter({ userRole })}
          />
        </div>
      )}

      {fields.includes('answerIds') && (
        <div>
          <MultiSelectFilter
            data-testid="answerIds-combobox"
            label={t('pollVoteList.answerId')}
            options={answers.map(answer => ({
              value: answer.id,
              label: answer.answer ?? answer.id,
            }))}
            value={filter?.answerIds ?? []}
            onChange={answerIds => updateFilter({ answerIds })}
          />
        </div>
      )}

      {fields.includes('title') && (
        <div>
          <TextField
            value={filter.title || ''}
            placeholder={t('filterableList.filter.title')}
            onChange={event => updateFilter({ title: event.target.value })}
          />
        </div>
      )}

      {fields.includes('description') && (
        <div>
          <TextField
            value={filter.description || ''}
            placeholder={t('filterableList.filter.description')}
            onChange={event =>
              updateFilter({ description: event.target.value })
            }
          />
        </div>
      )}

      {fields.includes('slug') && (
        <div>
          <TextField
            value={filter.slug || ''}
            placeholder={t('filterableList.filter.slug')}
            onChange={event => updateFilter({ slug: event.target.value })}
          />
        </div>
      )}

      {fields.includes('preTitle') && (
        <div>
          <TextField
            value={filter.preTitle || ''}
            placeholder={t('filterableList.filter.preTitle')}
            onChange={event => updateFilter({ preTitle: event.target.value })}
          />
        </div>
      )}

      {fields.includes('lead') && (
        <div>
          <TextField
            value={filter.lead || ''}
            placeholder={t('filterableList.filter.lead')}
            onChange={event => updateFilter({ lead: event.target.value })}
          />
        </div>
      )}

      {fields.includes('fingerprint') && (
        <div>
          <TextField
            value={filter.fingerprint || ''}
            placeholder={t('pollVoteList.fingerprint')}
            onChange={event =>
              updateFilter({ fingerprint: event.target.value })
            }
          />
        </div>
      )}

      {fields.includes('name') && (
        <div>
          <TextField
            value={filter.name || ''}
            placeholder={t('filterableList.filter.name')}
            onChange={event => updateFilter({ name: event.target.value })}
          />
        </div>
      )}

      {fields.includes('authors') && (
        <div>
          <AuthorCheckPicker
            list={authorsData as FullAuthorFragment[]}
            onChange={value => {
              return updateFilter({
                authors: value ? value.map(author => author.id) : [],
              });
            }}
          />
        </div>
      )}

      {fields.includes('tags') && (
        <div>
          <SelectTags
            defaultTags={[]}
            selectedTags={filter.tags ?? null}
            tagType={tagType ?? TagType.Article}
            setSelectedTags={tags => updateFilter({ tags })}
            placeholder={t('navbar.articleTags')}
          />
        </div>
      )}

      {!!publicationStates.length && (
        <div>
          <StateFilter
            label={t('filterableList.filter.states')}
            options={publicationStates.map(state => ({
              value: state,
              label: t(publicationStateLabels[state]),
              chipSx: publicationStateChipSx[state],
            }))}
            value={pickedStates}
            onChange={selected =>
              updateFilter(
                Object.fromEntries(
                  publicationStates.map(state => [
                    state,
                    (
                      !selected.length ||
                      selected.length === publicationStates.length
                    ) ?
                      null
                    : selected.includes(state) ? true
                    : null,
                  ])
                )
              )
            }
          />
        </div>
      )}

      {fields.includes('publicationDate') && (
        <div>
          <DateRangeFilter
            label={t('filterableList.filter.publicationDate')}
            value={{
              from:
                filter.publicationDateFrom?.date ?
                  new Date(filter.publicationDateFrom.date)
                : null,
              to:
                filter.publicationDateTo?.date ?
                  new Date(filter.publicationDateTo.date)
                : null,
            }}
            onChange={range =>
              updateFilter({
                publicationDateFrom:
                  range.from ?
                    {
                      date: range.from.toISOString(),
                      comparison: DateFilterComparison.GreaterThan,
                    }
                  : undefined,
                publicationDateTo:
                  range.to ?
                    {
                      date: range.to.toISOString(),
                      comparison: DateFilterComparison.LowerThanOrEqual,
                    }
                  : undefined,
              })
            }
          />
        </div>
      )}

      {fields.includes('dates') && (
        <div>
          <DateRangeFilter
            label={t('filterableList.filter.dates')}
            value={{
              from: filter.from ? new Date(filter.from) : null,
              to: filter.to ? new Date(filter.to) : null,
            }}
            onChange={range => {
              const from = range.from ? new Date(range.from) : null;
              const to = range.to ? new Date(range.to) : null;
              from?.setHours(0, 0, 0, 0);
              to?.setHours(23, 59, 59, 999);

              updateFilter({
                from: from?.toISOString(),
                to: to?.toISOString(),
              });
            }}
          />
        </div>
      )}

      {isPeerFilter && !!allPeers && (
        <div>
          <Autocomplete
            options={allPeers.map(peer => peer.id)}
            getOptionLabel={peerId =>
              allPeers.find(peer => peer.id === peerId)?.name ?? peerId
            }
            value={filter.peerId ?? null}
            onChange={(_event, peerId) =>
              updateFilter({ peerId: peerId ?? undefined })
            }
            renderInput={params => (
              <TextField
                {...params}
                label={t('peerArticles.filterByPeer')}
              />
            )}
            sx={{ minWidth: 200 }}
          />
        </div>
      )}

      {fields.includes('includeHidden') && (
        <div>
          <FormControlLabel
            control={
              <Switch
                checked={!!filter.includeHidden}
                onChange={(_event, value) =>
                  updateFilter({ includeHidden: value || null })
                }
              />
            }
            label={
              tagType === TagType.Page ?
                t('filterableList.filter.includeHiddenPages')
              : t('filterableList.filter.includeHiddenArticles')
            }
          />
        </div>
      )}
    </Form>
  );
}
