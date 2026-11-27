import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  LoginCodeConfirm,
  LoginCodeStep,
} from '../../lib/components/login-code/login-code-confirm';

export {
  type LoginCodeFailure,
  loginCodeFailure,
} from '../../lib/components/login-code/login-code-confirm';

export type LoginCodePageProps = { code: string };

export type LoginCodePageOptions = {
  next?: string;
  loginPath?: string;
};

export const createLoginCodePage = ({
  next = '/welcome?src=purl',
  loginPath = '/login',
}: LoginCodePageOptions = {}) => {
  const Page: NextPage<LoginCodePageProps> = ({ code }) => {
    const router = useRouter();

    const toLoginStep = (step: LoginCodeStep) =>
      router.replace(
        `${loginPath}?loginCode=${encodeURIComponent(code)}&${step}=1`
      );

    return (
      <LoginCodeConfirm
        code={code}
        loginPath={loginPath}
        onRedeemed={() => router.replace(next)}
        onStep={toLoginStep}
      />
    );
  };

  // Only hands the code to the page. Redeeming here would log in whatever
  // fetches the link: see `LoginCodeConfirm`.
  const getServerSideProps: GetServerSideProps<LoginCodePageProps> = async ({
    params,
  }) => ({
    props: { code: typeof params?.code === 'string' ? params.code : '' },
  });

  return { Page, getServerSideProps };
};
