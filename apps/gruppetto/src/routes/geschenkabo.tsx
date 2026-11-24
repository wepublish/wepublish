import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/geschenkabo')({
  beforeLoad: () => {
    throw redirect({
      href: 'https://shop.gruppetto-magazin.ch/collections/weihnachten',
      statusCode: 307,
    });
  },
});
