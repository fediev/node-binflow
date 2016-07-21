/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const buf12 = Buffer.from('0102', 'hex');
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

    it('should parse on array token', () => {
      const stru = {
        prop1: ['uint16', 2],
      };
      const expected = {
        prop1: [0x0201, 0x0403],
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
    it('should parse on array token with string token', () => {
      const stru = {
        prop1: 'uint8',
        prop2: ['uint16', 2],
        prop3: 'uint8',
      };
      const expected = {
        prop1: 0x01,
        prop2: [0x0302, 0x0504],
        prop3: 0x06,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });

    it('should parse `byte` array token', () => {
      const stru = {
        prop1: 'int8',
        prop2: ['byte', 4],
        prop3: 'int8',
      };
      const expected = {
        prop1: 0x01,
        prop2: Buffer.from('02030405', 'hex'),
        prop3: 0x06,
      };
      binflow.createBinflow(stru).parse(buf1234)
        .should.eql(expected, 'NE');
      binflow.createBinflow(stru, 'LE').parse(buf1234)
        .should.eql(expected, 'LE');
      binflow.createBinflow(stru, 'BE').parse(buf1234)
        .should.eql(expected, 'BE');
    });

    it('should parse `string` array token', () => {
      const str = 'STRING 문자열 123!@#';
      const strBuf = Buffer.from(str, 'utf8');
      const buf = Buffer.concat([
        Buffer.from('01', 'hex'),
        strBuf,
        Buffer.from('02', 'hex'),
      ]);
      const stru = {
        prop1: 'int8',
        prop2: ['string', strBuf.length],
        prop3: 'int8',
      };
      const expected = {
        prop1: 0x01,
        prop2: str,
        prop3: 0x02,
      };
      binflow.createBinflow(stru).parse(buf).should.eql(expected, 'NE');
      binflow.createBinflow(stru, 'LE').parse(buf).should.eql(expected, 'LE');
      binflow.createBinflow(stru, 'BE').parse(buf).should.eql(expected, 'BE');
    });

    it('should parse on object token', () => {
      const stru = {
        prop1: {
          subprop1: 'uint16',
          subprop2: 'uint8',
        },
      };
      const expected = {
        prop1: {
          subprop1: 0x0201,
          subprop2: 0x03,
        },
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
    it('should parse on object token with string token', () => {
      const stru = {
        prop1: 'uint8',
        prop2: {
          subprop1: 'uint16',
          subprop2: 'uint8',
        },
        prop3: 'uint8',
      };
      const expected = {
        prop1: 0x01,
        prop2: {
          subprop1: 0x0302,
          subprop2: 0x04,
        },
        prop3: 0x05,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });

    it('should throw RangeError when buf is not enough', () => {
      const stru = {
        prop1: 'uint32',
      };
      const bnf = binflow.createBinflow(stru);
      const doTest = () => bnf.parse(buf12);
      doTest.should.throw(RangeError);
    });
  });

  describe('getConsumedBufferSize()', () => {
    it('should get 0 on new binflow object', () => {
      const bnf = binflow.createBinflow();
      const result = bnf.getConsumedBufferSize();
      result.should.eql(0);
    });
    it('should get the number of consumed buffer size', () => {
      const stru = {
        prop1: 'uint8',
        prop2: 'uint16',
        prop3: ['int16', 2],
      };
      const bnf = binflow.createBinflow(stru);
      bnf.parse(buf1234);
      const result = bnf.getConsumedBufferSize();
      result.should.eql(7);
    });
  });
});
