import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  Divider as MuiDivider,
  Paper,
  PaperProps,
  TextField,
} from '@mui/material';
import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanSort,
  SortOrder,
} from '@wepublish/editor/api';
import { useCallback, useMemo, useState } from 'react';

import { humanizeError } from '../../humanizeError';
import { Pagination } from '../../listView/pagination';
import { enqueueSnackbar } from '../../snackbar';

const Divider = styled(MuiDivider)`
  margin: '12px 0';
`;

const StyledPagination = styled(Pagination)`
  padding: 8px 12px 12px;
`;

interface SelectMemberPlansProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  defaultMemberPlans: Pick<FullMemberPlanFragment, 'id' | 'name'>[];
  selectedMemberPlans?: string[] | null;
  setSelectedMemberPlans(memberplans: string[]): void;
}

type LabelledOption = { label: string; value: string };

export function SelectMemberPlans({
  className,
  disabled,
  name,
  defaultMemberPlans,
  selectedMemberPlans,
  setSelectedMemberPlans,
}: SelectMemberPlansProps) {
  const [page, setPage] = useState(1);
  const [cacheData, setCacheData] = useState(
    defaultMemberPlans.map(memberplan => ({
      label: memberplan.name,
      value: memberplan.id,
    })) as LabelledOption[]
  );

  /**
   * Error handling
   * @param error
   */
  const showErrors = (error: Error): void => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  const { data: memberplansData, refetch } = useQuery(MemberPlanListDocument, {
    variables: {
      sort: MemberPlanSort.CreatedAt,
      order: SortOrder.Ascending,
      take: 50,
    },
  });

  /**
   * Prepare available memberplans
   */
  const availableMemberPlans = useMemo(() => {
    if (!memberplansData?.memberPlans?.nodes) {
      return [];
    }

    return memberplansData.memberPlans.nodes.map(memberplan => ({
      label: memberplan.name,
      value: memberplan.id,
    }));
  }, [memberplansData]);

  const labelFor = (id: string) =>
    availableMemberPlans.find(option => option.value === id)?.label ??
    (cacheData.find(item => item.value === id)?.label as string) ??
    id;

  const PaperWithPager = useCallback(
    ({ children, ...props }: PaperProps) => (
      <Paper {...props}>
        {children}

        <Divider />

        <div onMouseDown={event => event.preventDefault()}>
          <StyledPagination
            compact
            state={{
              page,
              limit: 50,
              setPage,
              setLimit: () => undefined /* page size is fixed here */,
            }}
            totalCount={memberplansData?.memberPlans?.totalCount ?? 0}
          />
        </div>
      </Paper>
    ),
    [page, setPage, memberplansData]
  );

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      className={className}
      options={[
        ...availableMemberPlans.map(option => option.value),
        ...(selectedMemberPlans ?? []).filter(
          id => !availableMemberPlans.some(option => option.value === id)
        ),
      ]}
      getOptionLabel={id => labelFor(id)}
      filterOptions={options => options}
      onInputChange={(_event, word) =>
        refetch({
          filter: word ? { name: word } : undefined,
          sort: MemberPlanSort.CreatedAt,
          order: SortOrder.Ascending,
          take: 50,
        })
      }
      value={selectedMemberPlans ?? []}
      onChange={(_event, picked) => {
        setCacheData(previous => {
          const known = new Set(previous.map(item => item.value));
          const additions = availableMemberPlans.filter(
            option => picked.includes(option.value) && !known.has(option.value)
          );

          return additions.length ? [...previous, ...additions] : previous;
        });
        setSelectedMemberPlans(picked);
      }}
      slots={{ paper: PaperWithPager }}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
        />
      )}
      fullWidth
    />
  );
}
