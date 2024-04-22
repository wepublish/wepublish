import Property from '~/sdk/wep/models/properties/Property'

export default class Properties {
  public properties: Property[]

  constructor() {
    this.properties = []
  }

  parse(properties: Property[]) {
    this.properties = []
    for (const property of properties) {
      this.properties.push(new Property(property))
    }
    return this
  }

  public findPropertyByKeyAndValue(key: string, value: string) {
    return this.properties.find(property => property.key === key && property.value === value)
  }

  public findPropertyByKey(key: string) {
    return this.properties.find(property => property.key === key)
  }
}
