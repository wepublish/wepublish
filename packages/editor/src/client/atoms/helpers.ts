import {CSSStyle} from '@karma.run/react'

import {
  FlexDirectionProperty,
  JustifyContentProperty,
  JustifySelfProperty,
  AlignContentProperty,
  AlignSelfProperty,
  FlexBasisProperty,
  GlobalsNumber,
  FlexWrapProperty,
  MinWidthProperty,
  MaxWidthProperty,
  WidthProperty,
  HeightProperty,
  MinHeightProperty,
  MaxHeightProperty,
  PaddingProperty,
  PaddingTopProperty,
  PaddingBottomProperty,
  PaddingLeftProperty,
  PaddingRightProperty,
  MarginProperty,
  MarginTopProperty,
  MarginBottomProperty,
  MarginLeftProperty,
  MarginRightProperty,
  AlignItemsProperty,
  DisplayProperty,
  OverflowProperty,
  PositionProperty,
  TopProperty,
  BottomProperty,
  LeftProperty,
  RightProperty,
  ZIndexProperty
} from 'csstype'

export enum BlurStrength {
  Soft = '2px',
  Strong = '4px'
}

export enum Breakpoint {
  Mobile = 0,
  Tablet = 600,
  Desktop = 990
}

export enum ZIndex {
  Background,
  Default,
  Tooltip,
  NavigationBar,
  Modal,
  Toast,
  DragHelper
}

export enum Spacing {
  None = 0,
  ExtraTiny = 2,
  Tiny = 5,
  ExtraSmall = 10,
  Small = 20,
  Medium = 30,
  Large = 40,
  ExtraLarge = 60
}

export enum FontSize {
  Small = 12,
  Medium = 16,
  Large = 18,
  Heading3 = 20,
  Heading2 = 24,
  Heading1 = 28,
  ExtraLarge = 40
}

export enum BorderWidth {
  Small = 1
}

export enum BorderRadius {
  Tiny = 3,
  Small = 6,
  Medium = 10
}

export enum TransitionDurationRaw {
  Fast = 100,
  Slow = 200
}

export enum TransitionDuration {
  Fast = '100ms',
  Slow = '200ms',
  ExtraSlow = '500ms'
}

export enum LineHeight {
  None = 1,
  Default = 1.375
}

export const tabletMediaQuery = `@media screen and (max-width: ${Breakpoint.Desktop - 1}px)`
export const mobileMediaQuery = `@media screen and (max-width: ${Breakpoint.Tablet - 1}px)`

export function whenTablet(styles: CSSStyle) {
  return {[tabletMediaQuery]: styles}
}

export function whenMobile(styles: CSSStyle) {
  return {[mobileMediaQuery]: styles}
}

export function hexToRgba(hex: string | number, alpha: number) {
  hex = typeof hex === 'string' ? parseInt(hex[0] === '#' ? hex.slice(1) : hex, 16) : hex

  const red = 0xff & (hex >> 16)
  const green = 0xff & (hex >> 8)
  const blue = 0xff & (hex >> 0)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/* export function scrollBarStyle(theme: Theme): CSSStyle {
  return {
    '::-webkit-scrollbar': {
      width: Spacing.Tiny
    },

    '::-webkit-scrollbar-thumb': {
      backgroundColor: theme.colors.gray,
      borderTopLeftRadius: Spacing.Tiny,
      borderBottomLeftRadius: Spacing.Tiny
    },

    '::-webkit-scrollbar-track': {
      backgroundColor: theme.colors.grayLight,
      borderTopLeftRadius: Spacing.Tiny,
      borderBottomLeftRadius: Spacing.Tiny
    }
  }
} */

export type CSSLength = string | number

export interface PositionProps {
  readonly position?: PositionProperty
  readonly top?: TopProperty<CSSLength>
  readonly bottom?: BottomProperty<CSSLength>
  readonly left?: LeftProperty<CSSLength>
  readonly right?: RightProperty<CSSLength>
  readonly zIndex?: ZIndexProperty
}

export interface WidthProps {
  readonly width?: WidthProperty<CSSLength>
  readonly minWidth?: MinWidthProperty<CSSLength>
  readonly maxWidth?: MaxWidthProperty<CSSLength>
}

export interface HeightProps {
  readonly height?: HeightProperty<CSSLength>
  readonly minHeight?: MinHeightProperty<CSSLength>
  readonly maxHeight?: MaxHeightProperty<CSSLength>
}

export interface PaddingProps {
  readonly padding?: PaddingProperty<CSSLength>
  readonly paddingTop?: PaddingTopProperty<CSSLength>
  readonly paddingBottom?: PaddingBottomProperty<CSSLength>
  readonly paddingLeft?: PaddingLeftProperty<CSSLength>
  readonly paddingRight?: PaddingRightProperty<CSSLength>
}

export interface MarginProps {
  readonly margin?: MarginProperty<CSSLength>
  readonly marginTop?: MarginTopProperty<CSSLength>
  readonly marginBottom?: MarginBottomProperty<CSSLength>
  readonly marginLeft?: MarginLeftProperty<CSSLength>
  readonly marginRight?: MarginRightProperty<CSSLength>
}

export interface DisplayProps {
  readonly display?: DisplayProperty
}

export interface OverflowProps {
  readonly overflow?: OverflowProperty
}

export interface FlexContainerProps {
  readonly flexDirection?: FlexDirectionProperty
  readonly justifyContent?: JustifyContentProperty
  readonly alignContent?: AlignContentProperty
  readonly alignItems?: AlignItemsProperty
  readonly flexWrap?: FlexWrapProperty
}

export interface FlexChildProps {
  readonly justifySelf?: JustifySelfProperty
  readonly alignSelf?: AlignSelfProperty
  readonly flexBasis?: FlexBasisProperty<string>
  readonly flexGrow?: GlobalsNumber
  readonly flexShrink?: GlobalsNumber
}

export interface StyleProps
  extends WidthProps,
    HeightProps,
    PaddingProps,
    MarginProps,
    FlexContainerProps,
    FlexChildProps,
    DisplayProps,
    OverflowProps,
    PositionProps {}

export function extractStyleProps<P extends StyleProps>(
  input: P
): [StyleProps, Omit<P, keyof StyleProps>] {
  const {
    width,
    minWidth,
    maxWidth,
    height,
    minHeight,
    maxHeight,
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flexDirection,
    justifyContent,
    alignContent,
    alignItems,
    flexWrap,
    justifySelf,
    alignSelf,
    flexBasis,
    flexGrow,
    flexShrink,
    display,
    overflow,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    ...props
  } = input

  const styleProps: any = {
    width,
    minWidth,
    maxWidth,
    height,
    minHeight,
    maxHeight,
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flexDirection,
    justifyContent,
    alignContent,
    alignItems,
    flexWrap,
    justifySelf,
    alignSelf,
    flexBasis,
    flexGrow,
    flexShrink,
    display,
    overflow,
    position,
    top,
    bottom,
    left,
    right,
    zIndex
  }

  for (const key in styleProps) {
    if (styleProps[key] === undefined) {
      delete styleProps[key]
    }
  }

  return [styleProps, props]
}
