/**
 * The document a new issue starts from.
 *
 * The chrome — masthead, intro, advert, panel, impressum — comes from a sent
 * issue, so an editor opens the block editor on a complete newsletter and edits
 * rather than assembles. The teasers, two per rubric, are samples: a new issue
 * points every one of them at the newest published article of its own instance
 * (see `NewsletterCampaignService`), so the ids below are placeholders.
 *
 * This is data, not layout: it says nothing about how a block looks, only which
 * blocks are present and in what order. Restyling still happens in `theme.ts`,
 * and an editor is free to delete or reorder anything here.
 *
 * The three image blocks — logo, advert, portrait — come without an image: the
 * originals lived in the old editor's own storage, so an editor picks them from
 * the media library.
 */
import type { NewsletterDocument } from './document';

export const DEFAULT_DOCUMENT: NewsletterDocument = {
  preheader: 'Erneuerbare übertreffen alle Erwartungen',
  blocks: [
    {
      type: 'image',
      alt: 'ee-news.ch',
      href: 'https://eecomm.ch',
      gutter: 'none',
    },
    {
      type: 'meta',
      left: 'Newsletter',
      right: '13.8.2026',
    },
    {
      type: 'heading',
      text: 'Die Unterschätzten',
    },
    {
      type: 'text',
      gutter: 'intro',
      paragraphs: ['**Erneuerbare übertreffen alle Erwartungen**'],
    },
    {
      type: 'image',
      alt: 'Anzeige',
      href: 'https://www.solarmarkt.ch/de',
    },
    {
      type: 'text',
      gutter: 'intro',
      paragraphs: [
        '**Liebe Freundin, lieber Freund von ee/news**',
        'Wie lange sie schlecht geredet wurden und teils immer noch werden: Solar- und Windenergie haben sich prächtig entwickelt, trotz all der Steine, die ihnen in den letzten 10 Jahren in den Weg gelegt wurden und teils immer noch werden.',
        'Gemäss [www.energy-charts.info](http://www.energy-charts.info) stieg der jährliche Anteil der Erneuerbaren an der öffentlichen Nettostromerzeugung von 2015 bis 2025 in:',
        '- Deutschland von 35% auf 63%;',
        '- Österreich von 52% auf 75%;',
        '- Frankreich von 18% auf 31%;',
        '- Italien von 28% auf 34%.',
        'Das Schlusslicht ist: DIE SCHWEIZ. In den letzten 10 Jahren STAGNIERTE die Stromerzeugung aus erneuerbaren Energien faktisch mit einem Anstieg **um bloss einen Prozentpunkt von 60% auf 61%**, beschämend!',
        'Wäre da nicht der stark gestiegene Anteil an Solarstrom, wären wir sogar im Minus! Die Sonne hat den sinkenden Anteil von Wasserstrom teilweise ausgeglichen. Da die Windenergie aber hierzulande fachmännisch ausgebremst wird, kommen wir nicht vom Fleck.',
        'Zum Vergleich: folgend der 2025 verzeichnete Anteil der Nettostromerzeugung von Solar- und Windstrom in unseren Nachbarländern ( [www.energy-charts.info](http://www.energy-charts.info)):',
        '- Deutschland: Solarstrom 17%, Onshore-Windstrom 25%',
        '- Österreich: Solarstrom 10%, Windstrom 14%',
        '- Frankreich: Solarstrom 7%, Onshore-Windstrom 10%',
        '- Italien Solarstrom: 12%, Windstrom 8%',
        '- Schweiz Solarstrom: 12%, Windstrom 0.2%.',
        'Wo bleiben unsere Ambitionen?',
      ],
    },
    {
      type: 'image',
      alt: 'Anita Niederhäusern',
      caption: 'Anita Niederhäusern, Leitende Redaktorin',
    },
    {
      type: 'button',
      label: 'Unabhängige Fachinformationen unterstützen',
      href: 'https://ee-news.ch/a/in-eigener-sache-etappensieg-zukunft-gesichert-wissen-bewahrt',
    },
    {
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: [
        '**Photovoltaik-Module, gemacht für den Alpenraum**',
        'In den Alpen sind Photovoltaik-Module unter anderem tiefen Temperaturen sowie hohen Schneelasten ausgesetzt. Ein Team der Tessiner Fachhochschule SUPSI hat gemeinsam mit österreichischen Partnern erforscht, wie Solarmodule beschaffen sein müssen, damit sie diesen besonderen Belastungen standhalten.',
        '[Zur Meldung auf ee-news.ch](https://ee-news.ch/a/supsi-photovoltaik-module-gemacht-fuer-den-alpenraum)',
      ],
    },
    {
      type: 'rubric',
      name: 'Erneuerbare',
    },
    {
      type: 'teaser',
      variant: 'big',
      articleId: 'fdac6942-bdc4-4771-8566-5b0ebdb9873e',
    },
    {
      type: 'divider',
    },
    {
      type: 'teaser',
      variant: 'short',
      articleId: 'e5e33072-d860-42b1-87ae-dfd6b39e4742',
    },
    {
      type: 'rubric',
      name: 'Solar',
    },
    {
      type: 'teaser',
      variant: 'big',
      articleId: '00ee354d-bac2-41f5-a666-5ba4b9224a55',
    },
    {
      type: 'divider',
    },
    {
      type: 'teaser',
      variant: 'short',
      articleId: '4cf2bd5b-bd0a-4110-8339-8a466d276eb0',
    },
    {
      type: 'rubric',
      name: 'Wind',
    },
    {
      type: 'teaser',
      variant: 'big',
      articleId: 'b4efc4d7-d658-4f97-963a-6166fe64fb62',
    },
    {
      type: 'divider',
    },
    {
      type: 'teaser',
      variant: 'short',
      articleId: '40cdfdb7-5e20-43c0-93c1-5d7df3767bef',
    },
    {
      type: 'rubric',
      name: 'Wasser',
    },
    {
      type: 'teaser',
      variant: 'big',
      articleId: '4a120f0b-8f0e-48ff-8acc-03d463f53cb3',
    },
    {
      type: 'divider',
    },
    {
      type: 'teaser',
      variant: 'short',
      articleId: '1748cb6a-4e20-49f9-a042-03e19eecb980',
    },
    {
      type: 'rubric',
      name: 'Biomasse',
    },
    {
      type: 'teaser',
      variant: 'big',
      articleId: '3c7d73a7-5dd5-4bf8-8ed1-d5ae23651298',
    },
    {
      type: 'divider',
    },
    {
      type: 'teaser',
      variant: 'short',
      articleId: '1a4cce4c-db45-4497-88ce-ee27cfecf441',
    },
    {
      type: 'footer',
      title: 'ee-news.ch',
      lines: [
        '**Unabhängiger Journalismus zu erneuerbaren Energien, Energieeffizienz und Klima — mit Fokus Schweiz, Blick auf die Welt.**',
        'Leitende Redaktorin: Anita Niederhäusern, eecomm GmbH Redaktoren: Christa Schuh Freie Mitarbeiter: Bernward Janzing',
      ],
    },
  ],
};
