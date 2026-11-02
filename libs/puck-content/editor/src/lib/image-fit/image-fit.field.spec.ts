import {
  aspectRatioSchema,
  defaultImageFit,
  imageFitField,
  objectFitSchema,
} from './image-fit.field';

describe('aspectRatioSchema', () => {
  it('takes auto, the presets and custom width:height ratios', () => {
    for (const ratio of ['auto', '1:1', '16:9', '9:16', '5:4', '2.35:1']) {
      expect(aspectRatioSchema.safeParse(ratio).success).toBe(true);
    }
  });

  it('rejects anything CSS could not use', () => {
    for (const ratio of ['wide', '16/9', '16:', ':9', '']) {
      expect(aspectRatioSchema.safeParse(ratio).success).toBe(false);
    }
  });
});

describe('objectFitSchema', () => {
  it('takes the CSS object-fit keywords', () => {
    for (const fit of ['cover', 'contain', 'fill', 'none', 'scale-down']) {
      expect(objectFitSchema.safeParse(fit).success).toBe(true);
    }

    expect(objectFitSchema.safeParse('stretch').success).toBe(false);
  });
});

describe('imageFitField', () => {
  it('sets the ratio and fit per breakpoint with an AI schema', () => {
    expect(imageFitField()).toMatchObject({
      type: 'breakpoints',
      label: 'Aspect ratio & fit',
      objectFields: {
        aspectRatio: { type: 'aspectRatio' },
        objectFit: { type: 'objectFit' },
      },
      ai: {
        instructions: expect.stringContaining('breakpoint'),
        schema: expect.any(Object),
      },
    });
  });

  it('keeps the original ratio by default', () => {
    expect(defaultImageFit).toEqual({
      xs: { aspectRatio: 'auto', objectFit: 'cover' },
    });
  });
});
