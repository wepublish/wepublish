import Property, {PropertyKey, PropertyValue} from '~/sdk/wep/models/properties/Property'

export default class Properties {
  public properties: Property[]

  constructor() {
    this.properties = []
  }

  public parse(properties: Property[]): Properties {
    this.properties = []
    for (const property of properties) {
      this.properties.push(new Property(property))
    }
    return this
  }

  findPropertyByKeyAndValue(key: PropertyKey, value: PropertyValue): Property | undefined {
    return this.properties.find(property => property.key === key && property.value === value)
  }

  findPropertyByKey(key: PropertyKey): Property | undefined {
    return this.properties.find(property => property.key === key)
  }
}
