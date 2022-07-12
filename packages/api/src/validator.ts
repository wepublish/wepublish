import Joi = require('joi')

export class Validator {
  static createUser() {
    return Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().max(50).required(),
      firstName: Joi.string().max(50),
      preferredName: Joi.string().max(50)
    })
  }

  static login() {
    return Joi.object({
      email: Joi.string().email().required()
    })
  }
}
