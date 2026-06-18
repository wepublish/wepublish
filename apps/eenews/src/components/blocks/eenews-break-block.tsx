import styled from '@emotion/styled';
import {
  BuilderBreakBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const Wrapper = styled('div')`
  width: 100%;
  box-sizing: border-box;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  border: 1px solid ${({ theme }) => theme.palette.primary.main};
  padding: ${({ theme }) => theme.spacing(4)};
  margin: ${({ theme }) => theme.spacing(5)} 0;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: ${({ theme }) => theme.spacing(3)};
    margin: ${({ theme }) => theme.spacing(4)} 0;
  }
`;

const Segment = styled('div')`
  width: 100%;
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Heading = styled('div')`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-weight: 800;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const BreakImage = styled(Image)`
  width: 100%;
  height: auto;
  object-fit: cover;
`;

const RichTextWrapper = styled('div')`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.palette.primary.main};

  p,
  li {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: 28px;
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: -0.015em;
    margin: 0 0 ${({ theme }) => theme.spacing(2)};
  }
  p:last-child,
  li:last-child {
    margin-bottom: 0;
  }

  ${({ theme }) => theme.breakpoints.down('sm')} {
    p,
    li {
      font-size: 22px;
    }
  }
`;

const Actions = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const CtaButton = styled(Button)`
  width: fit-content;
`;

export const EenewsBreakBlock = ({
  className,
  text,
  image,
  richText,
  hideButton,
  linkTarget,
  linkText,
  linkURL,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  return (
    <Wrapper className={className}>
      <Segment>
        {image && <BreakImage image={image} />}

        {text && <Heading>{text}</Heading>}

        <RichTextWrapper>
          <RichText richText={richText} />
        </RichTextWrapper>

        {!hideButton && linkURL && linkText && (
          <Actions>
            <CtaButton
              variant={'ee-primary' as never}
              size="medium"
              LinkComponent={Link}
              href={linkURL ?? ''}
              target={linkTarget ?? '_blank'}
            >
              {linkText}
            </CtaButton>
          </Actions>
        )}
      </Segment>
    </Wrapper>
  );
};
