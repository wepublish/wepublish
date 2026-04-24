import styled from '@emotion/styled';
import { SubscribeBlock } from '@wepublish/block-content/website';
import { Subscribe } from '@wepublish/membership/website';

// Top-level form component — registered as `Subscribe` in the builder,
// used internally by SubscribeBlock when rendering the actual form.
export const ReflektSubscribeForm = styled(Subscribe)`
  background-color: orange;
`;

// Block-level component — registered as `blocks.Subscribe` in the builder.
// Receives only BuilderSubscribeBlockProps and fetches its own data via SubscribeBlockProvider.
export const ReflektSubscribe = styled(SubscribeBlock)`
  background-color: transparent;
  ${ReflektSubscribeForm} {
    background-color: transparent;
  }
`;
