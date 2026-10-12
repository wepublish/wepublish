import styled from '@emotion/styled';
import { RichTextBlock } from '@wepublish/block-content/website';

export const BkaSidebarRichTextBlock = styled(RichTextBlock)`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
  white-space: normal;

  && p,
  && h2,
  && h3,
  && h4 {
    margin: 0;
    font-family: ${({ theme }) => theme.typography.body1.fontFamily};
    font-size: 1.125rem;
    font-weight: 400;
    line-height: 1.2;
    color: ${({ theme }) => theme.palette.grey[600]};
    white-space: normal;
  }

  && ul {
    display: grid;
    align-content: start;
    gap: ${({ theme }) => theme.spacing(1)};
    margin: 0;
    padding: 0;
    list-style: none;
  }

  && a::before {
    content: '';
    display: inline-block;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    margin-right: ${({ theme }) => theme.spacing(1)};
    background: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 384 512%22%3E%3Cpath fill=%22%23000000%22 d=%22M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM216 232l0 102.1 31-31c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-72 72c-9.4 9.4-24.6 9.4-33.9 0l-72-72c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l31 31L168 232c0-13.3 10.7-24 24-24s24 10.7 24 24z%22/%3E%3C/svg%3E')
      no-repeat center / contain;
  }

  && a {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.5;
    text-decoration: underline;

    &:hover,
    &:focus {
      text-decoration: none;
    }
  }
`;
