/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');
const fullSpecStructure = require('./fullSpecStructure');

const buf12 = Buffer.from('0102', 'hex');
const buf1234 = Buffer.from('0102030405060708090a', 'hex');
const bufffff = Buffer.from('ffffffffffffffff', 'hex');

const fssBuf = Buffer.from(
  '0102010102030405060102030468656c6c6f020101020403030406050506' // ~ p6
  + '040302010102030402010403060508070102776f726c64010201030401' // ~ sp5
  + '010203040102030401020101020304010201',
  'hex'
);
const fssValues = {
  prop1: 0x0102,
  prop2: 0x01,
  prop3: [0x0102, 0x0304, 0x0506],
  prop4: Buffer.from('01020304', 'hex'),
  prop5: 'hello',
  prop6: [
    { oprop1: 0x0102, oprop2: 0x0102 },
    { oprop1: 0x0304, oprop2: 0x0304 },
    { oprop1: 0x0506, oprop2: 0x0506 },
  ],
  prop7: 0x01020304,
  prop8: {
    subprop1: 0x01020304,
    subprop2: [0x0102, 0x0304, 0x0506, 0x0708],
    subprop3: Buffer.from('0102', 'hex'),
    subprop4: 'world',
    subprop5: [
      { oprop1: 0x0102, oprop2: 0x01 },
      { oprop1: 0x0304, oprop2: 0x01 },
    ],
    subprop6: {
      subsubprop1: 0x01020304,
      subsubprop2: [0x01, 0x02, 0x03, 0x04],
    },
    subprop7: 0x01,
  },
  prop9: {
    sub2prop1: 0x0102,
    sub2prop2: 0x01020304,
    sub2prop3: 0x01,
  },
  prop10: 0x0102,
};

describe('binflow instance', () => {
  describe('setEndian', () => {
    const bnf = binflow.createBinflow();
    const doTest = (endian) => (() => bnf.setEndian(endian));

    it('should not throw on valid endian', () => {
      doTest('LE').should.not.throw();
      doTest('BE').should.not.throw();
    });
    it('should throw on wrong endian', () => {
      doTest('_INVALID_ENDIAN_').should.throw('WRONG_ENDIAN');
    });
    it('should return a bnf instance for chaining', () => {
      bnf.setEndian('BE').should.respondTo('struct');
      bnf.setEndian('BE').should.respondTo('parse');
      bnf.setEndian('BE').should.respondTo('encode');
    });
  });

  describe('getEndian', () => {
    it('should get `LE` with no endian specified', () => {
      const expected = 'LE';
      const bnf = binflow.createBinflow();
      const result = bnf.getEndian();
      result.should.eql(expected);
    });
    it('should get `LE` with LE endian specified', () => {
      const expected = 'LE';
      const bnf = binflow.createBinflow({}, expected);
      const result = bnf.getEndian();
      result.should.eql(expected);
    });
    it('should get `BE` with BE endian specified', () => {
      const expected = 'BE';
      const bnf = binflow.createBinflow({}, expected);
      const result = bnf.getEndian();
      result.should.eql(expected);
    });
  });

  describe('struct()', () => {
    it('should reset structure of binflow', () => {
      const stru1 = {
        prop1: 'uint32',
      };
      const expected = {
        prop1: 0x04030201,
      };
      const bnf = binflow.createBinflow(stru1);
      bnf.parse(buf1234).should.eql(expected);
      const stru2 = {
        prop1: 'uint16',
      };
      const expected2 = {
        prop1: 0x0201,
      };
      bnf.struct(stru2);
      bnf.parse(buf1234).should.eql(expected2);
    });
    it('should preserve endian without in-stru endian and param', () => {
      const stru = {
        prop1: 'uint32',
      };
      const bnf = binflow.createBinflow(stru, 'BE');
      bnf.getEndian().should.eql('BE');
      bnf.struct(stru);
      bnf.getEndian().should.eql('BE');
    });
    it('should reset endian with in-stru endian and no param', () => {
      const stru = {
        $endian: 'LE',
        prop1: 'uint32',
      };
      const bnf = binflow.createBinflow(stru, 'BE');
      bnf.getEndian().should.eql('BE');
      bnf.struct(stru);
      bnf.getEndian().should.eql('LE');
    });
    it('should reset endian with no in-stru endian and param', () => {
      const stru = {
        prop1: 'uint32',
      };
      const bnf = binflow.createBinflow(stru, 'BE');
      bnf.getEndian().should.eql('BE');
      bnf.struct(stru, 'LE');
      bnf.getEndian().should.eql('LE');
    });
    it('should reset endian with in-stru endian and param', () => {
      const stru = {
        $endian: 'BE',
        prop1: 'uint32',
      };
      const bnf = binflow.createBinflow(stru, 'BE');
      bnf.getEndian().should.eql('BE');
      bnf.struct(stru, 'LE');
      bnf.getEndian().should.eql('LE');
    });

    it('should return a bnf instance for chaining', () => {
      const stru = {
        prop1: 'uint32',
        prop2: 'uint8',
        prop3: 'uint16',
      };
      const expected = {
        prop1: 0x01020304,
        prop2: 0x05,
        prop3: 0x0607,
      };
      const bnf = binflow.createBinflow();
      bnf.struct(stru).should.respondTo('struct');
      bnf.struct(stru).should.respondTo('parse');
      bnf.struct(stru).should.respondTo('encode');
      bnf.struct(stru, 'BE').parse(buf1234).should.eql(expected);
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
    it('should parse object array token', () => {
      const stru = {
        prop1: 'int8',
        prop2: [{
          oprop1: 'int16',
          oprop2: 'int8',
        }, 2],
        prop3: 'int8',
      };
      const expected = {
        prop1: 0x01,
        prop2: [
          { oprop1: 0x0302, oprop2: 0x04 },
          { oprop1: 0x0605, oprop2: 0x07 },
        ],
        prop3: 0x08,
      };
      binflow.createBinflow(stru).parse(buf1234).should.eql(expected);
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

    it('should ignore `$endian`', () => {
      const stru = {
        prop1: 'int16',
        $endian: 'BE',
        prop2: 'uint32',
      };
      const expected = {
        prop1: 0x0102,
        prop2: 0x03040506,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });
    it('should recognize nested objects `$endian`', () => {
      const stru = {
        $endian: 'BE',
        prop1: 'int16',
        prop2: {
          $endian: 'LE',
          subprop1: 'int16',
        },
      };
      const expected = {
        prop1: 0x0102,
        prop2: {
          subprop1: 0x0403,
        },
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234);
      result.should.eql(expected);
    });

    it('should parse at specified starting point', () => {
      const stru = {
        prop1: 'uint8',
      };
      const startAt = 2;
      const expected = {
        prop1: 0x03,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf1234, startAt);
      result.should.eql(expected);
    });

    it('should return already parsed part when buffer is not enough', () => {
      const stru = {
        prop1: 'uint8',
        prop2: 'uint16',
      };
      const expected = { prop1: 0x01 };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf12);
      result.should.eql(expected);
    });

    it('should parse on full spec structure', () => {
      const expected = fssValues;
      const bnf = binflow.createBinflow(fullSpecStructure);
      const result = bnf.parse(fssBuf);
      result.should.eql(expected);
    });
  });

  describe('encode()', () => {
    const doTest = (stru, values, expected, endian) => {
      const bnf = binflow.createBinflow(stru, endian);
      const expectedBuf = Buffer.from(expected, 'hex');
      const result = bnf.encode(values);
      result.should.eql(expectedBuf);
    };

    it('should encode single string token', () => {
      const stru = {
        prop1: 'uint32',
      };
      const values = {
        prop1: 1,
      };
      const expected = '01000000';
      doTest(stru, values, expected);
    });
    it('should encode multi string token', () => {
      const stru = {
        prop1: 'uint16',
        prop2: 'int16LE',
        prop3: 'uint32BE',
      };
      const values = {
        prop1: 1,
        prop2: 2,
        prop3: 3,
      };
      const expected = '0100020000000003';
      doTest(stru, values, expected);
    });
    it('should encode multi string token with LE', () => {
      const stru = {
        prop1: 'uint16',
        prop2: 'int16LE',
        prop3: 'uint32BE',
      };
      const values = {
        prop1: 1,
        prop2: 2,
        prop3: 3,
      };
      const expected = '0100020000000003';
      doTest(stru, values, expected, 'LE');
    });
    it('should encode multi string token with BE', () => {
      const stru = {
        prop1: 'uint16',
        prop2: 'int16LE',
        prop3: 'uint32BE',
      };
      const values = {
        prop1: 1,
        prop2: 2,
        prop3: 3,
      };
      const expected = '0001020000000003';
      doTest(stru, values, expected, 'BE');
    });
    it('should encode -1 correctly', () => {
      const stru = {
        prop1: 'int8',
        prop2: 'uint8',
      };
      const values = {
        prop1: -1,
        prop2: 255,
      };
      const expected = 'ffff';
      doTest(stru, values, expected);
    });

    it('should encode array token', () => {
      const stru = {
        prop1: ['uint16', 2],
      };
      const values = {
        prop1: [1, 2],
      };
      const expected = '01000200';
      doTest(stru, values, expected);
    });
    it('should encode array token with string token', () => {
      const stru = {
        prop1: 'uint8',
        prop2: ['uint16', 2],
        prop3: 'uint8',
      };
      const values = {
        prop1: 1,
        prop2: [2, 3],
        prop3: 4,
      };
      const expected = '010200030004';
      doTest(stru, values, expected);
    });
    it('should encode `byte` type token', () => {
      const stru = {
        prop1: 'int8',
        prop2: ['byte', 4],
        prop3: 'int8',
      };
      const values = {
        prop1: 1,
        prop2: Buffer.from('02030405', 'hex'),
        prop3: 6,
      };
      const expected = '010203040506';
      doTest(stru, values, expected);
    });
    it('should encode `string` type token', () => {
      const str = 'STRING 문자열 123!@#';
      const strBuf = Buffer.from(str, 'utf8');
      const stru = {
        prop1: 'int8',
        prop2: ['string', strBuf.length],
        prop3: 'int8',
      };
      const values = {
        prop1: 1,
        prop2: str,
        prop3: 2,
      };
      const expected = Buffer.concat([
        Buffer.from('01', 'hex'),
        strBuf,
        Buffer.from('02', 'hex'),
      ]);
      const bnf = binflow.createBinflow(stru);
      bnf.encode(values).should.eql(expected);
    });
    it('should encode object array token', () => {
      const stru = {
        prop1: 'int8',
        prop2: [{
          oprop1: 'int16',
          oprop2: 'int8',
        }, 2],
        prop3: 'int8',
      };
      const values = {
        prop1: 0x01,
        prop2: [
          { oprop1: 0x0302, oprop2: 0x04 },
          { oprop1: 0x0605, oprop2: 0x07 },
        ],
        prop3: 0x08,
      };
      const expected = '0102030405060708';
      doTest(stru, values, expected);
    });

    it('should encode object token', () => {
      const stru = {
        prop1: {
          subprop1: 'uint16',
          subprop2: 'uint8',
        },
      };
      const values = {
        prop1: {
          subprop1: 0x0102,
          subprop2: 0x03,
        },
      };
      const expected = '020103';
      doTest(stru, values, expected);
    });
    it('should encode object token in object token field', () => {
      const stru = {
        prop1: {
          sub1: 'int8',
          sub2: {
            ssub1: 'int16',
            ssub2: 'int8',
          },
        },
      };
      const values = {
        prop1: {
          sub1: 0x01,
          sub2: {
            ssub1: 0x0203,
            ssub2: 0x04,
          },
        },
      };
      const expected = '01030204';
      doTest(stru, values, expected);
    });

    it('should ignore `$endian`', () => {
      const stru = {
        prop1: 'int16',
        $endian: 'BE',
        prop2: 'uint32',
      };
      const values = {
        prop1: 0x0102,
        prop2: 0x03040506,
      };
      const expected = '010203040506';
      doTest(stru, values, expected);
    });
    it('should recognize nested objects `$endian`', () => {
      const stru = {
        $endian: 'BE',
        prop1: 'int16',
        prop2: {
          $endian: 'LE',
          subprop1: 'int16',
        },
      };
      const values = {
        prop1: 0x0102,
        prop2: {
          subprop1: 0x0304,
        },
      };
      const expected = '01020403';
      doTest(stru, values, expected);
    });

    it('should set buffer of available array values only', () => {
      const stru = {
        prop1: ['int8', 3],
      };
      const values = {
        prop1: [0x01, 0x02],
      };
      const expected = '010200';
      doTest(stru, values, expected);
    });
    it('should set buffer of available object array values only', () => {
      const stru = {
        prop1: [{
          sub1: 'int8',
          sub2: 'int16',
        }, 3],
      };
      const values = {
        prop1: [
          { sub1: 0x01, sub2: 0x0203 },
          { sub1: 0x04, sub2: 0x0506 },
        ],
      };
      const expected = '010302040605000000';
      doTest(stru, values, expected);
    });
    it('should set buffer of available object array property only', () => {
      const stru = {
        prop1: [{
          sub1: 'int8',
          sub2: 'int16',
        }, 3],
      };
      const values = {
        prop1: [
          { sub1: 0x01 },
          { sub2: 0x0203 },
          { sub1: 0x04 },
        ],
      };
      const expected = '010000000302040000';
      doTest(stru, values, expected);
    });
    it('should set buffer of available object property values only', () => {
      const stru = {
        prop1: {
          sub1: 'int8',
          sub2: 'int16',
        },
      };
      const values = {
        prop1: { sub2: 0x0203 },
      };
      const expected = '000302';
      doTest(stru, values, expected);
    });

    it('should not set buffer when value is undefined', () => {
      const stru = {
        prop1: 'int8',
        prop2: 'int8',
        prop3: ['int8', 2],
        prop4: ['byte', 2],
        prop5: ['string', 2],
        prop6: [{ sub1: 'int8' }, 2],
        prop7: { sub2: 'int8', sub3: 'int8' },
        prop8: { sub4: 'int8', sub5: { ssub1: 'int8', ssub2: 'int8' } },
        prop9: 'int8',
      };
      const values = {
        prop1: 0x01,
        prop9: 0x02,
      };
      const baseBuf = Buffer.from('ffffffffffffffffffffffffffffffff', 'hex');
      const expected = Buffer.from('01ffffffffffffffffffffffffffff02', 'hex');
      const bnf = binflow.createBinflow(stru);
      const result = bnf.encode(values, baseBuf);
      result.should.eql(expected);
    });
    it('should encode on full spec structure', () => {
      const values = fssValues;
      const expected = fssBuf;
      const bnf = binflow.createBinflow(fullSpecStructure);
      const result = bnf.encode(values);
      result.should.eql(expected);
    });
  });

  describe('set()', () => {
    // structure size : 24 bytes
    const stru = {
      $endian: 'BE',
      prop1: 'int8',
      prop2: 'int16LE',
      prop3: ['int8', 3],
      prop4: ['byte', 2],
      prop5: ['string', 2],
      prop6: [{
        oprop1: 'int8',
        oprop2: 'int16LE',
      }, 2],
      prop7: {
        subprop1: 'int16',
        subprop2: 'int8',
      },
      prop8: {
        subprop3: 'int8',
        subprop4: {
          subsubprop1: 'int8',
          subsubprop2: 'int16LE',
        },
      },
      prop9: 'int8',
    };
    const bnf = binflow.createBinflow(stru);
    const doTest = (field, value, expected, subfield) => {
      const expectedBuf = Buffer.from(expected, 'hex');
      const buf = Buffer.from(
        'ffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'
      );
      bnf.set(buf, field, subfield, value);
      buf.should.eql(expectedBuf);
    };

    it('should set string token field', () => {
      const field = 'prop2';
      const value = 0x0102;
      const expected = 'ff0201ffffffffffffffffffffffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set array token field', () => {
      const field = 'prop3';
      const value = [0x01, 0x02, 0x03];
      const expected = 'ffffff010203ffffffffffffffffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set byte type token field', () => {
      const field = 'prop4';
      const value = Buffer.from('0102', 'hex');
      const expected = 'ffffffffffff0102ffffffffffffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set string type token field', () => {
      const field = 'prop5';
      const value = 'ad';
      const expected = 'ffffffffffffffff6164ffffffffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set object array token field', () => {
      const field = 'prop6';
      const value = [
        { oprop1: 0x01, oprop2: 0x0203 },
        { oprop1: 0x04, oprop2: 0x0506 },
      ];
      const expected = 'ffffffffffffffffffff010302040605ffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set object token field', () => {
      const field = 'prop7';
      const value = {
        subprop1: 0x0102,
        subprop2: 0x03,
      };
      const expected = 'ffffffffffffffffffffffffffffffff010203ffffffffff';
      doTest(field, value, expected);
    });
    it('should set object token in object token field', () => {
      const field = 'subprop4';
      const value = {
        subsubprop1: 0x01,
        subsubprop2: 0x0203,
      };
      const expected = 'ffffffffffffffffffffffffffffffffffffffff010302ff';
      doTest(field, value, expected);
    });

    it('should set array token field with index', () => {
      const field = 'prop3';
      const index = 1;
      const value = 0x01;
      const expected = 'ffffffff01ffffffffffffffffffffffffffffffffffffff';
      doTest(field, value, expected, index);
    });
    it('should not set with overflowed index', () => {
      const field = 'prop3';
      const index = 3;
      const value = 0x01;
      const expected = 'ffffffffffffffffffffffffffffffffffffffffffffffff';
      doTest(field, value, expected, index);
    });
    it('should set multi values with object value', () => {
      const values = {
        prop2: 0x0102,
        prop3: [0x01, 0x02],
        prop7: { subprop2: 0x01 },
        prop9: 0x01,
      };
      const expected = Buffer.from(
        'ff02010102ffffffffffffffffffffffffff01ffffffff01', 'hex'
      );
      const buf = Buffer.from(
        'ffffffffffffffffffffffffffffffffffffffffffffffff', 'hex'
      );
      bnf.set(buf, values);
      buf.should.eql(expected);
    });

    it('should set buffer of available array values only', () => {
      const field = 'prop3';
      const value = [0x01, 0x02];
      const expected = 'ffffff0102ffffffffffffffffffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set buffer of available object array values only', () => {
      const field = 'prop6';
      const value = [
        { oprop1: 0x01, oprop2: 0x0203 },
      ];
      const expected = 'ffffffffffffffffffff010302ffffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set buffer of available object array property only', () => {
      const field = 'prop6';
      const value = [
        { oprop1: 0x01 },
        { oprop1: 0x02 },
      ];
      const expected = 'ffffffffffffffffffff01ffff02ffffffffffffffffffff';
      doTest(field, value, expected);
    });
    it('should set buffer of available object property values only', () => {
      const field = 'prop7';
      const value = {
        subprop2: 0x01,
      };
      const expected = 'ffffffffffffffffffffffffffffffffffff01ffffffffff';
      doTest(field, value, expected);
    });

    it('should not set buffer when value is undefined', () => {
      const stru2 = {
        prop1: 'int8',
        prop2: 'int8',
        prop3: ['int8', 2],
        prop4: ['byte', 2],
        prop5: ['string', 2],
        prop6: [{ sub1: 'int8' }, 2],
        prop7: { sub2: 'int8', sub3: 'int8' },
        prop8: { sub4: 'int8', sub5: { ssub1: 'int8', ssub2: 'int8' } },
        prop9: 'int8',
      };
      // eslint-disable-next-line no-undefined
      const value = undefined;
      const bnf2 = binflow.createBinflow(stru2);
      const buf = Buffer.from('ffffffffffffffffffffffffffffffff', 'hex');
      const expected = Buffer.from(buf);
      Object.keys(stru2).forEach((key) => {
        bnf2.set(buf, key, value);
      });
      buf.should.eql(expected);
    });

    it('should return a bnf instance for chaining', () => {
      const stru2 = {
        prop1: 'int16BE',
        prop2: 'int8',
        prop3: 'uint8',
        prop4: 'int16',
      };
      const bnf2 = binflow.createBinflow(stru2);
      const buf = Buffer.alloc(6);
      bnf2.set(buf, 'prop1', 0x0102).should.respondTo('struct');
      bnf2.set(buf, 'prop1', 0x0102).should.respondTo('parse');
      bnf2.set(buf, 'prop1', 0x0102).should.respondTo('encode');

      bnf2.set(buf, 'prop1', 0x0304)
          .set(buf, 'prop2', -1)
          .set(buf, 'prop4', 0x0607);
      const expected = Buffer.from('0304ff000706', 'hex');
      buf.should.eql(expected);
    });
  });

  describe('get()', () => {
    const stru = {
      $endian: 'BE',
      prop1: 'int16',
      prop2: 'int16BE',
      prop3: ['int16LE', 3],
      prop4: [{
        oprop1: 'int8',
        oprop2: 'int16LE',
      }, 2],
      prop5: {
        subprop1: 'int16',
        subprop2: 'int8',
      },
      prop6: {
        subprop3: 'int8',
        subprop4: {
          subsubprop1: 'int16',
          subsubprop2: 'int8',
        },
      },
      prop7: 'int8',
    };
    const bnf = binflow.createBinflow(stru);
    const doTest = (field, expected, subfield) => {
      const buf = Buffer.from(
        '010201020201040306050103020406050102030101020301', 'hex'
      );
      const result = bnf.get(buf, field, subfield);
      result.should.eql(expected);
    };

    it('should get string field', () => {
      const field = 'prop2';
      const expected = 0x0102;
      doTest(field, expected);
    });
    it('should get array field', () => {
      const field = 'prop3';
      const expected = [0x0102, 0x0304, 0x0506];
      doTest(field, expected);
    });
    it('should get array item field', () => {
      const field = 'prop3';
      const subfield = 1;
      const expected = 0x0304;
      doTest(field, expected, subfield);
    });
    it('should get object array field', () => {
      const field = 'prop4';
      const expected = [
        { oprop1: 0x01, oprop2: 0x0203 },
        { oprop1: 0x04, oprop2: 0x0506 },
      ];
      doTest(field, expected);
    });
    it('should get object field', () => {
      const field = 'prop5';
      const expected = {
        subprop1: 0x0102,
        subprop2: 0x03,
      };
      doTest(field, expected);
    });
    it('should get object prop field', () => {
      const field = 'subprop1';
      const expected = 0x0102;
      doTest(field, expected);
    });
    it('should get nested object prop field', () => {
      const field = 'subsubprop2';
      const expected = 0x03;
      doTest(field, expected);
    });
    it('should get object child field', () => {
      const field = 'prop5';
      const subfield = 'subprop2';
      const expected = 0x03;
      doTest(field, expected, subfield);
    });
    it('should get string field 2', () => {
      const field = 'prop7';
      const expected = 0x01;
      doTest(field, expected);
    });

    it('should get undefined when buffer is not enough', () => {
      const stru2 = {
        prop1: 'int8',
        prop2: 'int16',
      };
      const bnf2 = binflow.createBinflow(stru2);
      // eslint-disable-next-line no-undefined
      should.equal(bnf2.get(buf12, 'prop2'), undefined);
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
