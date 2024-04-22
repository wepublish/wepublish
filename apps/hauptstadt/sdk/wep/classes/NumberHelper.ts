export default class NumberHelper {
  public static roundChf(chf: number): string {
    return (Math.round(chf * 100) / 100).toFixed(2)
  }

  public static formatChf(chf: number): string {
    return new Intl.NumberFormat('de-CH', {style: 'currency', currency: 'CHF'}).format(chf)
  }
}
