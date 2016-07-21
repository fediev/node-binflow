/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const buf1234 = Buffer.from('0102030405060708090a', 'hex');
const bufffff = Buffer.from('ffffffffffffffff', 'hex');

describe('binflow instance', () => {
  describe('setEndian', () => {
    const bnf = binflow.createBinflow();
    // eslint-disable-next-line no-extra-parens
    const doTest = (endian) => (() => bnf.setEndian(endian));

    it('should not throw on valid endian', () => {
      doTest('LE').should.not.throw();
      doTest('BE').should.not.throw();
    });
    it('should throw on wrong endian', () => {
      doTest('_INVALID_ENDIAN_').should.throw('WRONG_ENDIAN');
    });
  });

  describe('parse()', () => {
    it('should parse on one string token', () => {
      const stru = {
        prop1: 'uint8',
      };
      const expected = {
        prop1: 0x01,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
    it('should parse on multi string tokens', () => {
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const expected = {
        prop1: 0xff,
        prop2: -1,
        prop3: -1,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(bufffff);
      result.should.eql(expected);
    });
    it('should parse on multi string tokens, LE', () => {
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const expected = {
        prop1: 0x01,
        prop2: 0x02,
        prop3: 0x06050403,
      };
      const bnf = binflow.createBinflow(stru, 'LE');
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
    it('should parse on multi string tokens, BE', () => {
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const expected = {
        prop1: 0x01,
        prop2: 0x02,
        prop3: 0x03040506,
      };
      const bnf = binflow.createBinflow(stru, 'BE');
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
  });
});
