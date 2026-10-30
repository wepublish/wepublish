import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
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
import { ReactNode, useCallback, useMemo, useState } from 'react';

import { humanizeError } from '../../humanizeError';
import { Pagination } from '../../listView/pagination';
import { enqueueSnackbar } from '../../snackbar';

const Divider = styled(MuiDivider)`
  margin: '12px 0';
`;

const StyledPagination = styled(Pagination)`
  margin: 0 12px 12px;
`;

interface SelectMemberPlanProps {
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  label?: ReactNode;
  helperText?: ReactNode;
  error?: boolean;
  defaultMemberPlan?: Pick<FullMemberPlanFragment, 'id' | 'name'> | null;
  selectedMemberPlan?: string | null;
  setSelectedMemberPlan(memberPlanId: string | null): void;
  'aria-labelledby'?: string;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
}

const take = 50;

export function SelectMemberPlan({
  className,
  disabled,
  readOnly,
  id,
  name,
  label,
  helperText,
  error,
  defaultMemberPlan,
  selectedMemberPlan,
  setSelectedMemberPlan,
  'aria-labelledby': ariaLabelledby,
  renderInput,
}: SelectMemberPlanProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const showErrors = (error: Error): void => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  const { data, previousData } = useQuery(MemberPlanListDocument, {
    variables: {
      filter: search ? { name: search } : undefined,
      sort: MemberPlanSort.CreatedAt,
      order: SortOrder.Ascending,
      take,
      skip: (page - 1) * take,
    },
  });
  const memberplansData = data ?? previousData;

  const availableMemberPlans = useMemo(() => {
    const nodes = memberplansData?.memberPlans?.nodes ?? [];
    const items = nodes.map(memberplan => ({
      label: memberplan.name,
      value: memberplan.id,
    }));

    if (
      defaultMemberPlan &&
      !items.some(item => item.value === defaultMemberPlan.id)
    ) {
      items.unshift({
        label: defaultMemberPlan.name,
        value: defaultMemberPlan.id,
      });
    }

    return items;
  }, [memberplansData, defaultMemberPlan]);

  const PaperWithPager = useCallback(
    ({ children, ...props }: PaperProps) => (
      <Paper {...props}>
        {children}

        <Divider />

        <div onMouseDown={event => event.preventDefault()}>
          <StyledPagination
            state={{
              page,
              limit: take,
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
      id={id}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      options={availableMemberPlans.map(plan => plan.value)}
      getOptionLabel={id =>
        availableMemberPlans.find(plan => plan.value === id)?.label ?? id
      }
      filterOptions={options => options}
      onInputChange={(_event, word) => {
        setPage(1);
        setSearch(word);
      }}
      value={selectedMemberPlan ?? null}
      onChange={(_event, value) => setSelectedMemberPlan(value)}
      slots={{ paper: PaperWithPager }}
      renderInput={
        renderInput ??
        (params => (
          <TextField
            {...params}
            label={label}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                'aria-labelledby': ariaLabelledby,
              },
            }}
            name={name}
            helperText={helperText}
            error={error}
          />
        ))
      }
      fullWidth
    />
  );
}
