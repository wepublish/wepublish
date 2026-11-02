import { BadRequestException } from '@nestjs/common';
import { BlockContentInput, mapBlockUnionMap } from './block-content.model';

const title = (timing: unknown) =>
  ({ title: { title: 'Title', timing } }) as unknown as BlockContentInput;

describe('mapBlockUnionMap', () => {
  it('keeps a valid timing', () => {
    const timing = { timeOfDay: { from: '22:00', to: '02:00' } };

    expect(mapBlockUnionMap(title(timing))).toMatchObject({ timing });
  });

  it('rejects a block with an invalid timing', () => {
    expect(() =>
      mapBlockUnionMap(title({ timeOfDay: { from: '9:00', to: '17:00' } }))
    ).toThrow(BadRequestException);
  });

  it('rejects an invalid timing nested in a flex block', () => {
    expect(() =>
      mapBlockUnionMap({
        flexBlock: {
          blockStyle: undefined,
          blocks: [
            {
              alignment: { i: '0', x: 0, y: 0, w: 1, h: 1, static: false },
              block: title({
                from: new Date('2026-01-06T00:00:00Z'),
                to: new Date('2026-01-05T00:00:00Z'),
              }),
            },
          ],
        },
      } as unknown as BlockContentInput)
    ).toThrow(BadRequestException);
  });
});
