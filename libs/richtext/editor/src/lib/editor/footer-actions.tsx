import { HeadingActions } from './footer-actions/heading-actions';
import { LinkActions } from './footer-actions/link-actions';
import { TableActions } from './footer-actions/table-actions';

export function FooterActions() {
  return (
    <>
      <TableActions />
      <LinkActions />
      <HeadingActions />
    </>
  );
}
