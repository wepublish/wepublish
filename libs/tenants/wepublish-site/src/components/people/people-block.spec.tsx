import { screen, within } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockAuthor,
  mockAuthorLink,
  mockAuthorsBlock,
  mockImage,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullAuthorFragment } from '@wepublish/website/api';

import { wepublishSiteTenant } from '../../wepublish-site-tenant';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { WepAuthorsBlock } from './people-block';

const bio = (text: string) =>
  ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }) as FullAuthorFragment['bio'];

const stephan = mockAuthor({
  name: 'Stephan Agnolazza',
  jobTitle: 'Senior Advisor, Vaduz',
  url: 'https://wepublish.ch/author/stephan',
  image: mockImage({ title: 'Porträt Stephan Agnolazza' }),
  bio: bio('In Zeiten von Sparrunden.'),
  links: [
    mockAuthorLink({ title: 'LinkedIn', url: 'https://linkedin.com/in/sa' }),
    mockAuthorLink({ title: 'E-Mail', url: 'mailto:stephan@wepublish.ch' }),
  ],
});

const manuel = mockAuthor({
  name: 'Manuel Bertschi',
  jobTitle: 'Stiftungsratspräsident',
  url: 'https://wepublish.ch/author/manuel',
  bio: bio('Medienvielfalt stärken.'),
  links: [],
});

const renderBlock = (blockStyle: string | null) =>
  renderWithProviders(
    <WepAuthorsBlock
      {...mockAuthorsBlock({
        title: 'Stiftungsrat',
        blockStyle,
        authors: [stephan, manuel],
      })}
    />,
    { tenant: wepublishSiteTenant, router: { locale: 'de' } }
  );

const person = (name: string) => screen.getByRole('article', { name });

describe('authors block', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('is the block for authors of the site', () => {
    expect(wepublishSiteTenant.builder.blocks?.Authors).toBe(WepAuthorsBlock);
  });

  describe.each([
    ['as grid', null],
    ['as list', WepBlockStyles.PeopleList],
  ])('%s', (_, blockStyle) => {
    it('shows the title above the people in their order', () => {
      renderBlock(blockStyle);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Stiftungsrat' })
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('article').map(article => article.textContent)
      ).toEqual([
        expect.stringContaining('Stephan Agnolazza'),
        expect.stringContaining('Manuel Bertschi'),
      ]);
    });

    it('shows portrait, name linked to the person and job title', () => {
      renderBlock(blockStyle);

      expect(
        within(person('Stephan Agnolazza')).getByRole('img', {
          name: 'Porträt Stephan Agnolazza',
        })
      ).toBeInTheDocument();
      expect(
        within(person('Manuel Bertschi')).getByRole('link', {
          name: 'Manuel Bertschi',
        })
      ).toHaveAttribute('href', 'https://wepublish.ch/author/manuel');
      expect(
        within(person('Manuel Bertschi')).getByText('Stiftungsratspräsident')
      ).toBeInTheDocument();
    });
  });

  describe('as grid', () => {
    it('shows only the e-mail address as button, without the text', () => {
      renderBlock(null);

      expect(
        within(person('Stephan Agnolazza')).getByRole('link', {
          name: 'stephan@wepublish.ch',
        })
      ).toHaveAttribute('href', 'mailto:stephan@wepublish.ch');
      expect(
        screen.queryByText('In Zeiten von Sparrunden.')
      ).not.toBeInTheDocument();
    });
  });

  describe('as list', () => {
    it('shows the text and every link of a person as button', () => {
      renderBlock(WepBlockStyles.PeopleList);

      const stephanRow = person('Stephan Agnolazza');

      expect(
        within(stephanRow).getByText('In Zeiten von Sparrunden.')
      ).toBeInTheDocument();
      expect(
        within(stephanRow).getByRole('link', { name: 'LinkedIn' })
      ).toHaveAttribute('href', 'https://linkedin.com/in/sa');
      expect(
        within(stephanRow).getByRole('link', { name: 'E-Mail' })
      ).toHaveAttribute('href', 'mailto:stephan@wepublish.ch');
    });
  });
});
