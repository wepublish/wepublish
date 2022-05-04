import {slugify} from '../../src/client/utility'
describe('slugify', () => {
  test.each([
    'text with spaces',
    'text with UPPERCASE',
    '    text starting with spaces',
    'text with special characters like ·/_,:;\\',
    'text with hyphenized-words',
    'text with double -- dashes ',
    'text with multiple ------------- dashes',
    '- text starting with a dash',
    'text ending with a dash -',
    'umlaute like ä ö and ü',
    'special a like ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ',
    'special c like ÇĆĈČ',
    'special d like ÐĎĐÞ',
    'special e like ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ',
    'special g like ĜĞĢǴ',
    'special h like ĤḦ',
    'special i like ÌÍÎÏĨĪĮİỈỊ',
    'special j like Ĵ',
    'special ij like Ĳ',
    'special k like Ķ',
    'special l like ĹĻĽŁ',
    'special m like Ḿ',
    'special n like ÑŃŅŇ',
    'special o like ÒÓÔÕØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ',
    'special oe like Œ',
    'special p like ṕ',
    'special r like ŔŖŘ',
    'special s like ŚŜŞŠ',
    'special ss like ß',
    'special t like ŢŤ',
    'special u like ÙÚÛŨŪŬŮŰŲỤỦỨỪỬỮỰƯ',
    'special w like ẂŴẀẄ',
    'special x like ẍ',
    'special y like ÝŶŸỲỴỶỸ',
    'special z like ŹŻŽ'
  ])('should transform %s correctly', text => {
    const result = slugify(text)
    expect(result).toMatchSnapshot()
  })
})
