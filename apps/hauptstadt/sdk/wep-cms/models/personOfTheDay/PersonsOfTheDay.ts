import moment from 'moment'
import PersonOfTheDay from '~/sdk/wep-cms/models/personOfTheDay/PersonOfTheDay'

export default class PersonsOfTheDay {
  public personsOfTheDay: PersonOfTheDay[]
  public totalCount: number | undefined

  constructor() {
    this.personsOfTheDay = []
    this.totalCount = undefined
  }

  public parse({
    personsOfTheDay,
    totalCount
  }: {
    personsOfTheDay: PersonOfTheDay[]
    totalCount: number | undefined
  }): this {
    this.totalCount = totalCount
    for (const personOfTheDay of personsOfTheDay) {
      this.personsOfTheDay.push(new PersonOfTheDay(personOfTheDay))
    }
    return this
  }

  public setCurrentDateAsSecondElement(): this {
    if (this.personsOfTheDay.length < 2) {
      return this
    }
    const today = moment()
    // search for element with today's publication date
    const personOfTheDayIndex = this.personsOfTheDay.findIndex(personOfTheDay => {
      if (!personOfTheDay.publicationDate) {
        return false
      }
      return personOfTheDay.publicationDate.isSame(today, 'day')
    })

    // swap element on position 2 (index = 1) with person who was published today
    if (personOfTheDayIndex >= 0) {
      return this.swapElements(personOfTheDayIndex, 1)
    }

    // search for any publication in the future
    const futurePersonIndex = this.personsOfTheDay.findIndex((personOfTheDay: PersonOfTheDay) => {
      if (!personOfTheDay.publicationDate) {
        return false
      }
      return personOfTheDay.publicationDate.isAfter(today, 'day')
    })

    // if there is any person in the future, show the slider as is
    if (futurePersonIndex >= 0) {
      return this
    }

    // All element are older than today.
    // Swap first with second element, so that the most recent element is at second position in the slider (main image)
    return this.swapElements(0, 1)
  }

  private swapElements(indexA: number, indexB: number): this {
    const newSecondElement = this.personsOfTheDay[indexA]
    const newSwapElement = this.personsOfTheDay[indexB]
    this.personsOfTheDay[indexB] = newSecondElement
    this.personsOfTheDay[indexA] = newSwapElement
    return this
  }

  public allLoaded(): boolean {
    return this.personsOfTheDay.length === this.totalCount
  }

  public updatePerson(personOfTheDay: PersonOfTheDay): this {
    const index = this.personsOfTheDay.findIndex(
      tmpPersonOfTheDay => tmpPersonOfTheDay.id === personOfTheDay.id
    )
    if (index < 0) {
      return this
    }
    this.personsOfTheDay[index] = personOfTheDay
    return this
  }

  public clone(): PersonsOfTheDay {
    return new PersonsOfTheDay().parse({
      personsOfTheDay: this.personsOfTheDay,
      totalCount: this.totalCount
    })
  }

  public createDummies(numberOfDummies: number) {
    if (numberOfDummies <= 0) {
      throw new Error('Number of dummies have to be higher than 0')
    }
    for (let i = 0; i < numberOfDummies; i++) {
      this.personsOfTheDay.push(
        new PersonOfTheDay({
          id: 999999 + i,
          name: '',
          title: '',
          description: '',
          publicationDate: moment(),
          image: '',
          likes: 0,
          dummy: true
        })
      )
    }
  }
}
