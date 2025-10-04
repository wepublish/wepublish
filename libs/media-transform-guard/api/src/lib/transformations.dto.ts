import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const stringToJSONSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
    return z.NEVER;
  }
});

export const TransformationsSchema = z
  .object({
    sig: z.coerce.string(),
    quality: z.coerce.number(),
    negate: z.coerce.boolean(),
    grayscale: z.coerce.boolean(),
    sharpen: z.coerce.boolean(),
    flip: z.coerce.boolean(),
    flop: z.coerce.boolean(),
    rotate: z.coerce.number(),
    blur: z.coerce.number().or(z.coerce.boolean()),
    resize: stringToJSONSchema.pipe(
      z
        .object({
          width: z.coerce.number(),
          height: z.coerce.number(),
          withoutEnlargement: z.coerce.boolean(),
          withoutReduction: z.coerce.boolean(),
          fastShrinkOnLoad: z.coerce.boolean(),
          background: z.string(),
          fit: z.enum(['contain', 'cover', 'fill', 'inside', 'outside']),
          position: z.coerce.number().or(z.string()),
          kernel: z.enum([
            'nearest',
            'cubic',
            'mitchell',
            'lanczos2',
            'lanczos3',
          ]),
        })
        .partial()
    ),
    extend: stringToJSONSchema.pipe(
      z
        .object({
          top: z.coerce.number(),
          left: z.coerce.number(),
          bottom: z.coerce.number(),
          right: z.coerce.number(),
          background: z.string(),
          extendWidth: z.enum(['background', 'copy', 'repeat', 'mirror']),
        })
        .partial()
    ),
  })
  .partial();

export class TransformationsDto extends createZodDto(TransformationsSchema) {}
