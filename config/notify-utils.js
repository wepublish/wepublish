function slugify(text, separator = '-') {
  return text
    .toString()
    .normalize('NFD') // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator)
}

const {BRANCH_NAME} = process.env
const GITHUB_REF_SHORT = slugify(BRANCH_NAME.substring(0, 12))

module.exports = {
  GITHUB_REF_SHORT
}
