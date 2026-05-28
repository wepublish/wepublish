import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';

export const ReflektMemberPlanPicker = styled(MemberPlanPicker)`
  display: grid;

  ${MemberPlanPickerRadios} {
    grid-template-columns: repeat(4, 1fr);
    label {
      display: contents;
    }
  }

  ${RichTextBlockWrapper} {
    display: none;
  }
`;
