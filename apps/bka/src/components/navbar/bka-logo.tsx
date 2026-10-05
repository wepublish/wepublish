import styled from '@emotion/styled';

const LogoImage = styled('img')`
  display: block;
  width: 100%;
  height: auto;
`;

export type BkaLogoProps = {
  className?: string;
  alt?: string;
  variant?: 'stacked' | 'horizontal';
};

export const BkaLogo = ({
  className,
  alt = 'Berner Kulturagenda',
  variant = 'stacked',
}: BkaLogoProps) => (
  <LogoImage
    className={className}
    src={
      variant === 'horizontal' ? '/logo-bka-horizontal.svg' : '/logo-bka.svg'
    }
    alt={alt}
    width={variant === 'horizontal' ? 219 : 170}
    height={variant === 'horizontal' ? 46 : 122}
  />
);
