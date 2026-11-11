import styled from '@emotion/styled';
import { UserForm } from '@wepublish/authentication/website';
import { BuilderUserFormProps } from '@wepublish/website/builder';
import { useEffect } from 'react';
import { Control, useController } from 'react-hook-form';

const StyledUserForm = styled(UserForm)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .MuiOutlinedInput-root {
    border-radius: 0;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }
`;

const PreselectCountry = ({ control }: { control: Control<any> }) => {
  const { field } = useController({ name: 'address.country', control });

  useEffect(() => {
    if (!field.value) {
      field.onChange('Schweiz');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const ReflektUserForm = (props: BuilderUserFormProps) => (
  <>
    <StyledUserForm {...props} />
    {props.fields.includes('address') && (
      <PreselectCountry control={props.control} />
    )}
  </>
);
