import { slugify } from './slugify';

describe('slugify', () => {
  it.each([
    'text with spaces',
    'text with UPPERCASE',
    '    text starting with spaces',
    'text with special characters like ·/_,:;\\',
    'text with hyphenized-words',
    'text with double -- dashes ',
    'text with multiple ------------- dashes',
    '- text starting with a dash',
    'text ending with a dash -',
    'text with umlaute like ä ö and ü',
    'text with special a like ÀÁÂÃÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ',
    'text with special c like ÇĆĈČ',
    'text with special d like ÐĎĐÞ',
    'text with special e like ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ',
    'text with special g like ĜĞĢǴ',
    'text with special h like ĤḦ',
    'text with special i like ÌÍÎÏĨĪĮİỈỊ',
    'text with special j like Ĵ',
    'text with special ij like Ĳ',
    'text with special k like Ķ',
    'text with special l like ĹĻĽŁ',
    'text with special m like Ḿ',
    'text with special n like ÑŃŅŇ',
    'text with special o like ÒÓÔÕØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ',
    'text with special oe like Œ',
    'text with special p like ṕ',
    'text with special r like ŔŖŘ',
    'text with special s like ŚŜŞŠ',
    'text with special ss like ß',
    'text with special t like ŢŤ',
    'text with special u like ÙÚÛŨŪŬŮŰŲỤỦỨỪỬỮỰƯ',
    'text with special w like ẂŴẀẄ',
    'text with special x like ẍ',
    'text with special y like ÝŶŸỲỴỶỸ',
    'text with special z like ŹŻŽ',
  ])('should transform %s correctly', text => {
    const result = slugify(text);
    expect(result).toMatchSnapshot();
  });
});
