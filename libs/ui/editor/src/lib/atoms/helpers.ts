export enum BlurStrength {
  Soft = '2px',
  Strong = '4px',
}

export enum Breakpoint {
  Mobile = 0,
  Tablet = 600,
  Desktop = 990,
}

export enum ZIndex {
  Background,
  Default,
  Tooltip,
  NavigationBar,
  Modal,
  Toast,
  DragHelper,
}

export enum Spacing {
  None = 0,
  ExtraTiny = 2,
  Tiny = 5,
  ExtraSmall = 10,
  Small = 20,
  Medium = 30,
  Large = 40,
  ExtraLarge = 60,
}

export enum FontSize {
  Small = 12,
  Medium = 16,
  Large = 18,
  Heading3 = 20,
  Heading2 = 24,
  Heading1 = 28,
  ExtraLarge = 40,
}

export enum BorderWidth {
  Small = 1,
}

export enum BorderRadius {
  Tiny = 3,
  Small = 6,
  Medium = 10,
}

export enum TransitionDurationRaw {
  Fast = 100,
  Slow = 200,
}

export enum TransitionDuration {
  Fast = '100ms',
  Slow = '200ms',
  ExtraSlow = '500ms',
}

export enum LineHeight {
  None = 1,
  Default = 1.375,
}

export const tabletMediaQuery = `@media screen and (max-width: ${Breakpoint.Desktop - 1}px)`;
export const mobileMediaQuery = `@media screen and (max-width: ${Breakpoint.Tablet - 1}px)`;

export function whenTablet(styles: any) {
  return { [tabletMediaQuery]: styles };
}

export function whenMobile(styles: any) {
  return { [mobileMediaQuery]: styles };
}

export function hexToRgba(hex: string | number, alpha: number) {
  hex =
    typeof hex === 'string' ?
      parseInt(hex[0] === '#' ? hex.slice(1) : hex, 16)
    : hex;

  const red = 0xff & (hex >> 16);
  const green = 0xff & (hex >> 8);
  const blue = 0xff & (hex >> 0);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
