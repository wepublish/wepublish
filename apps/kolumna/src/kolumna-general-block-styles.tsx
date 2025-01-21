import {ApiV1, hasBlockStyle} from '@wepublish/website'
import {anyPass} from 'ramda'

export const isPrimaryBg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Primary Bg'), hasBlockStyle('Türkis Bg')])(block)

export const isSecondaryBg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Secondary Bg'), hasBlockStyle('Lila Bg')])(block)

export const isAccentBg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Accent Bg'), hasBlockStyle('Orange Bg')])(block)

export const isAccentLightBg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Accent Light Bg'), hasBlockStyle('Gelb Bg')])(block)

export const isPrimaryFg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Primary Fg'), hasBlockStyle('Türkis Fg')])(block)

export const isSecondaryFg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Secondary Fg'), hasBlockStyle('Lila Fg')])(block)

export const isAccentFg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Accent Fg'), hasBlockStyle('Orange Fg')])(block)

export const isAccentLightFg = (block: ApiV1.Block): boolean =>
  anyPass([hasBlockStyle('Accent Light Fg'), hasBlockStyle('Gelb Fg')])(block)
