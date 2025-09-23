import {
  base64Encode,
  base64Decode,
  markResultAsProxied,
  isSourceProxied,
  capitalizeFirstLetter,
  countRichtextChars,
  isObject,
  isArray,
  isString,
  isBoolean,
} from './utility';

describe('Utility Functions', () => {
  describe('base64Encode and base64Decode', () => {
    it('should encode a string to base64 and decode it back', () => {
      const original = 'Hello World';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe('markResultAsProxied and isSourceProxied', () => {
    it('should mark an object as proxied and check if it is proxied', () => {
      const obj = { key: 'value' };
      markResultAsProxied(obj);
      expect(isSourceProxied(obj)).toBe(true);
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });
  });

  describe('countRichtextChars', () => {
    it('should count characters in a richtext object', () => {
      const nodes = [{ text: 'Hello' }, { children: [{ text: 'World' }] }];
      expect(countRichtextChars(0, nodes)).toBe(10);
    });
  });

  describe('isObject', () => {
    it('should check if a variable is an object', () => {
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject([])).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should check if a variable is an array', () => {
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({ key: 'value' })).toBe(false);
    });
  });

  describe('isString', () => {
    it('should check if a variable is a string', () => {
      expect(isString('Hello')).toBe(true);
      expect(isString(123)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should check if a variable is a boolean', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean('true')).toBe(false);
    });
  });
});
