export default class Password {
  public password?: string
  public passwordRepeated?: string

  constructor() {
    this.password = undefined
    this.passwordRepeated = undefined
  }

  public isValid({
    passwordLength,
    skipEmptyPassword,
    skipPasswordEqual,
    skipNumber,
    skipSpecialCharacter,
    skipCapitalLetter,
    skipSmallLetter
  }: {
    passwordLength?: number
    skipEmptyPassword?: boolean
    skipPasswordEqual?: boolean
    skipNumber?: boolean
    skipSpecialCharacter?: boolean
    skipCapitalLetter?: boolean
    skipSmallLetter?: boolean
  }): true | string {
    if (skipEmptyPassword && this.emptyPassword()) {
      return true
    }
    if (!skipPasswordEqual && !this.passwordEqual()) {
      return 'Wiederholung des Passwortes ist nicht identisch.'
    }
    if (!!passwordLength && !this.passwordLength(passwordLength)) {
      return 'Passwort ist zu kurz.'
    }
    if (!skipNumber && !this.hasNumber()) {
      return 'Passwort muss eine Nummer enthalten.'
    }
    if (!skipSpecialCharacter && !this.hasSpecialCharacter()) {
      return 'Passwort muss ein spezielles Zeichen enthalten.'
    }
    if (!skipCapitalLetter && !this.hasCapitalLetter()) {
      return 'Passwort muss einen Grossbuchstaben enthalten.'
    }
    if (!skipSmallLetter && !this.hasSmallLetter()) {
      return 'Passwort muss einen Kleinbuchstaben enthalten.'
    }
    return true
  }

  public emptyPassword(): boolean {
    return this.password === undefined
  }

  public passwordEqual(): boolean {
    if (!this.password) {
      return false
    }
    return this.password === this.passwordRepeated
  }

  public passwordLength(length: number): boolean {
    if (!this.password) {
      return false
    }
    return this.password.length >= length
  }

  public hasNumber(): boolean {
    if (!this.password) {
      return false
    }
    return /[0-9]+/.test(this.password)
  }

  public hasSpecialCharacter(): boolean {
    if (!this.password) {
      return false
    }
    return /[*+-@!#%&()^~{}_`´"·$/=?¿¡'ºª]+/.test(this.password)
  }

  public hasCapitalLetter(): boolean {
    if (!this.password) {
      return false
    }
    return /[A-Z]+/.test(this.password)
  }

  public hasSmallLetter(): boolean {
    if (!this.password) {
      return false
    }
    return /[a-z]+/.test(this.password)
  }
}
