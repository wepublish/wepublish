import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanSort,
  SortOrder,
} from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Divider as RDivider,
  Message,
  Pagination as RPagination,
  TagPicker,
  toaster,
} from 'rsuite';
import type { Option } from 'rsuite/esm/internals/types';

import { DEFAULT_MAX_TABLE_PAGES } from '../../utility';
import { humanizeError } from '../../humanizeError';

const Divider = styled(RDivider)`
  margin: '12px 0';
`;

const Pagination = styled(RPagination)`
  margin: 0 12px 12px;
`;

interface SelectMemberPlansProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  defaultMemberPlans: Pick<FullMemberPlanFragment, 'id' | 'name'>[];
  selectedMemberPlans?: string[] | null;
  setSelectedMemberPlans(memberplans: string[]): void;
}

export function SelectMemberPlans({
  className,
  disabled,
  name,
  defaultMemberPlans,
  selectedMemberPlans,
  setSelectedMemberPlans,
}: SelectMemberPlansProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [cacheData, setCacheData] = useState(
    defaultMemberPlans.map(memberplan => ({
      label: memberplan.name,
      value: memberplan.id,
    })) as Option<string | number>[]
  );

  /**
   * Error handling
   * @param error
   */
  const showErrors = (error: Error): void => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {humanizeError(error)}
      </Message>
    );
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

  return (
    <TagPicker
      block
      virtualized
      disabled={disabled}
      className={className}
      name={name}
      value={selectedMemberPlans}
      data={availableMemberPlans}
      cacheData={cacheData}
      onSearch={word => {
        refetch({
          filter: word ? { name: word } : undefined,
          sort: MemberPlanSort.CreatedAt,
          order: SortOrder.Ascending,
          take: 50,
        });
      }}
      onSelect={(value, item, event) => {
        setCacheData([...cacheData, item]);
        refetch();
      }}
      onChange={(value, item) => {
        setSelectedMemberPlans(value);
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
