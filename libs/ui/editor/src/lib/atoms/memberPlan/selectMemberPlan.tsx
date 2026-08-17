import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  MemberPlan,
  MemberPlanSort,
  SortOrder,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import {
  Divider as RDivider,
  Message,
  Pagination as RPagination,
  SelectPicker,
  toaster,
} from 'rsuite';

import { DEFAULT_MAX_TABLE_PAGES } from '../../utility';

const Divider = styled(RDivider)`
  margin: '12px 0';
`;

const Pagination = styled(RPagination)`
  margin: 0 12px 12px;
`;

interface SelectMemberPlanProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  defaultMemberPlan?: Pick<MemberPlan, 'id' | 'name'> | null;
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

  const showErrors = (error: ApolloError): void => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
  };

  const { data: memberplansData, refetch } = useMemberPlanListQuery({
    variables: {
      sort: MemberPlanSort.CreatedAt,
      order: SortOrder.Ascending,
      take: 50,
    },
    onError: showErrors,
  });

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

            <Pagination
              limit={50}
              maxButtons={DEFAULT_MAX_TABLE_PAGES}
              first
              last
              prev
              next
              ellipsis
              boundaryLinks
              layout={['total', '-', '|', 'pager']}
              total={memberplansData?.memberPlans?.totalCount ?? 0}
              activePage={page}
              onChangePage={page => setPage(page)}
            />
          </>
        );
      }}
    />
  );
}
