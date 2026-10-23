import '@wepublish/event/api';
import { Test } from '@nestjs/testing';
import {
  ArticleService,
  HOT_AND_TRENDING_DATA_SOURCE,
} from '@wepublish/article/api';
import { EventService } from '@wepublish/event/api';
import { PageService } from '@wepublish/page/api';
import { BlockTemplateDataloaderService } from '../block-template/block-template-dataloader.service';
import { SlotTeasersLoader } from './slot-teasers-loader';
import { TeaserListBlockResolver } from './teaser-list.resolver';
import { TeaserType } from './teaser.model';
import { TeaserSlotType } from '../teaser-slot/teaser-slot.model';

describe('event teasers with the event library loaded first, as at boot', () => {
  const setup = async () => {
    const eventService = {
      getPublicEvents: vi
        .fn()
        .mockResolvedValue({ nodes: [{ id: 'event-1' }] }),
    };

    const module = await Test.createTestingModule({
      providers: [
        SlotTeasersLoader,
        TeaserListBlockResolver,
        { provide: EventService, useValue: eventService },
        { provide: ArticleService, useValue: {} },
        { provide: PageService, useValue: {} },
        { provide: HOT_AND_TRENDING_DATA_SOURCE, useValue: {} },
        { provide: BlockTemplateDataloaderService, useValue: {} },
      ],
    }).compile();

    return { module, eventService };
  };

  it('resolves the teaser list resolver', async () => {
    const { module } = await setup();

    expect(await module.resolve(TeaserListBlockResolver)).toBeInstanceOf(
      TeaserListBlockResolver
    );
  });

  it('autofills event slots from the public events', async () => {
    const { module, eventService } = await setup();
    const loader = await module.resolve(SlotTeasersLoader);

    await expect(
      loader.getAutofillTeasers(
        {
          autofillConfig: {
            enabled: true,
            teaserType: TeaserType.Event,
            filter: { tags: ['tag-1'] },
          },
          slots: [
            { type: TeaserSlotType.Autofill },
            { type: TeaserSlotType.Autofill },
          ],
        } as never,
        []
      )
    ).resolves.toEqual([
      expect.objectContaining({ eventID: 'event-1', type: TeaserType.Event }),
    ]);
    expect(eventService.getPublicEvents).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { tagIds: ['tag-1'] }, take: 2 })
    );
  });
});
