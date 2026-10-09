import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Divider as MuiDivider } from '@mui/material';
import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanSort,
  SortOrder,
} from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';
import { SelectPicker } from 'rsuite';

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
  name?: string;
  defaultMemberPlan?: Pick<FullMemberPlanFragment, 'id' | 'name'> | null;
  selectedMemberPlan?: string | null;
  setSelectedMemberPlan(memberPlanId: string | null): void;
}

export function SelectMemberPlan({
  className,
  disabled,
  name,
  defaultMemberPlan,
  selectedMemberPlan,
  setSelectedMemberPlan,
}: SelectMemberPlanProps) {
  const [page, setPage] = useState(1);

  const showErrors = (error: Error): void => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  const {
    data: memberplansData,
    error: memberPlanListError,
    refetch,
  } = useQuery(MemberPlanListDocument, {
    variables: {
      sort: MemberPlanSort.CreatedAt,
      order: SortOrder.Ascending,
      take: 50,
    },
  });

  useEffect(() => {
    if (memberPlanListError) {
      showErrors(memberPlanListError);
    }
  }, [memberPlanListError]);

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

  return (
    <SelectPicker
      block
      virtualized
      disabled={disabled}
      className={className}
      name={name}
      value={selectedMemberPlan}
      data={availableMemberPlans}
      onSearch={word => {
        refetch({
          filter: word ? { name: word } : undefined,
          sort: MemberPlanSort.CreatedAt,
          order: SortOrder.Ascending,
          take: 50,
        });
      }}
      onChange={(value, event) => {
        setSelectedMemberPlan(value);
      }}
      renderListbox={menu => {
        return (
          <>
            {menu}

            <Divider />

            <StyledPagination
              state={{
                page,
                limit: 50,
                setPage,
                setLimit: () => undefined /* page size was fixed here */,
              }}
              totalCount={memberplansData?.memberPlans?.totalCount ?? 0}
            />
          </>
        );
      }}
    />
  );
}
