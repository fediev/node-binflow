/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const tokensNE = binflow.TYPES; // tokens with No Endian
const tokensLE = tokensNE.map((token) => `${token}LE`);
const tokensBE = tokensNE.map((token) => `${token}BE`);
// const tokensAll = [...tokens, ...tokensLE, ...tokensBE];
const buf12 = Buffer.from('0102', 'hex');
const buf1234 = Buffer.from('0102030405060708090a', 'hex');
const bufffff = Buffer.from('ffffffffffffffff', 'hex');

describe('Binflow', () => {
  describe('createBinflow()', () => {
    const validStru = {
      prop1: 'int8',
      prop2: ['uint8', 5],
      prop3: {
        subprop1: 'int32',
      },
    };

    it('should create a binflow object with no params', () => {
      const result = binflow.createBinflow();
      result.should.respondTo('struct');
    });
    it('should create a binflow object on valid structure', () => {
      const result = binflow.createBinflow(validStru);
      result.should.respondTo('parse');
    });
    it('should throw on invalid structure', () => {
      const stru = {
        prop1: '_INVALID_TOKEN_',
      };
      const fn = () => binflow.createBinflow(stru);
      fn.should.throw();
    });
    it('should create a binflow object on valid endian', () => {
      binflow.createBinflow(validStru, 'LE').should.respondTo('parse', 'LE');
      binflow.createBinflow(validStru, 'BE').should.respondTo('parse', 'BE');
    });
    it('should throw on invalid endian', () => {
      const fn = () => binflow.createBinflow(validStru, '_NE_');
      fn.should.throw();
    });
  });

  describe('_hasEndian()', () => {
    const _hasEndian = binflow._hasEndian;

    it('should get false on normal tokens', () => {
      tokensNE.forEach((token) => {
        _hasEndian(token).should.be.false;
      });
    });
    it('should get true on endian-tailed tokens', () => {
      tokensLE.forEach((token) => {
        _hasEndian(token).should.be.true;
      });
      tokensBE.forEach((token) => {
        _hasEndian(token).should.be.true;
      });
    });
  });

  describe('_getType()', () => {
    const _getType = binflow._getType;

    it('should get token itself on normal tokens', () => {
      tokensNE.forEach((token) => {
        _getType(token).should.eql(token);
      });
    });
    it('should get types on endian-tailed tokens', () => {
      tokensLE.forEach((token, idx) => {
        _getType(token).should.eql(binflow.TYPES[idx]);
      });
      tokensBE.forEach((token, idx) => {
        _getType(token).should.eql(binflow.TYPES[idx]);
      });
    });
  });

  describe('_validateStructure()', () => {
    const _validateStructure = binflow._validateStructure;

    it('should return true on a valid structure', () => {
      const stru = {
        prop1: 'int8',
        prop2: 'uint16LE',
        prop3: ['uint32BE', 3],
      };
      const result = _validateStructure(stru);
      result.should.be.true;
    });

    it('should return true on a valid string token', () => {
      const stru = {
        prop1: 'int8',
      };
      const result = _validateStructure(stru);
      result.should.be.true;
    });
    it('should throw on wrong string token', () => {
      const stru = {
        prop1: '_INVALID_TOKEN_',
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
    it('should throw on `byte` string token', () => {
      const stru = {
        prop1: 'byte',
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
    it('should throw on `string` string token', () => {
      const stru = {
        prop1: 'string',
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });

    it('should return true on a valid array token', () => {
      const stru = {
        prop1: ['int8', 10],
      };
      const result = _validateStructure(stru);
      result.should.be.true;
    });
    it('should throw on wrong array token', () => {
      const stru = {
        prop1: ['_INVALID_TOKEN_', 10],
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
    it('should throw on wrong array count', () => {
      const stru = {
        prop1: ['int8', '_NOT_NUMBER_'],
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
    it('should throw on wrong array token without count', () => {
      const stru = {
        prop1: ['int8'],
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });

    it('should return true on valid object token', () => {
      const stru = {
        prop1: {
          subprop1: 'int8',
          subprop2: ['uint8', 10],
        },
      };
      const result = _validateStructure(stru);
      result.should.be.true;
    });
    it('should return true on nested object token', () => {
      const stru = {
        prop1: {
          subprop1: {
            aa: 'int8',
            bb: ['uint8', 10],
          },
        },
      };
      const result = _validateStructure(stru);
      result.should.be.true;
    });

    it('should throw on invalid object token', () => {
      const stru = {
        prop1: {
          subprop1: '_INVALID_TOKEN_',
        },
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
    it('should throw on invalid nested object token', () => {
      const stru = {
        prop1: {
          subprop1: {
            aa: '_INVALID_TOKEN_',
          },
        },
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });

    it('should throw on not supporte token type', () => {
      const stru = {
        prop1: 1,
      };
      const fn = () => _validateStructure(stru);
      fn.should.throw();
    });
  });

  // eslint-disable-next-line max-statements
  describe('_readByToken()', () => {
    const _readByToken = binflow._readByToken;

    const doIntTest = (token) => {
      const result = [];
      result.push(_readByToken(buf1234, 0, token));
      result.push(_readByToken(buf1234, 1, token, 'LE'));
      result.push(_readByToken(buf1234, 1, token, 'BE'));
      result.push(_readByToken(bufffff, 0, token));
      return result;
    };

    it('should read `int8`', () => {
      const token = 'int8';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int8LE`', () => {
      const token = 'int8LE';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int8BE`', () => {
      const token = 'int8BE';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int16', () => {
      const token = 'int16';
      const expected = [0x0201, 0x0302, 0x0203, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int16LE', () => {
      const token = 'int16LE';
      const expected = [0x0201, 0x0302, 0x0302, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int16BE', () => {
      const token = 'int16BE';
      const expected = [0x0102, 0x0203, 0x0203, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int32', () => {
      const token = 'int32';
      const expected = [0x04030201, 0x05040302, 0x02030405, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int32LE', () => {
      const token = 'int32LE';
      const expected = [0x04030201, 0x05040302, 0x05040302, -1];
      doIntTest(token).should.eql(expected);
    });
    it('should read `int32BE', () => {
      const token = 'int32BE';
      const expected = [0x01020304, 0x02030405, 0x02030405, -1];
      doIntTest(token).should.eql(expected);
    });

    it('should read `uint8`', () => {
      const token = 'uint8';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint8LE`', () => {
      const token = 'uint8LE';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint8BE`', () => {
      const token = 'uint8BE';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint16', () => {
      const token = 'uint16';
      const expected = [0x0201, 0x0302, 0x0203, 0xffff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint16LE', () => {
      const token = 'uint16LE';
      const expected = [0x0201, 0x0302, 0x0302, 0xffff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint16BE', () => {
      const token = 'uint16BE';
      const expected = [0x0102, 0x0203, 0x0203, 0xffff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint32', () => {
      const token = 'uint32';
      const expected = [0x04030201, 0x05040302, 0x02030405, 0xffffffff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint32LE', () => {
      const token = 'uint32LE';
      const expected = [0x04030201, 0x05040302, 0x05040302, 0xffffffff];
      doIntTest(token).should.eql(expected);
    });
    it('should read `uint32BE', () => {
      const token = 'uint32BE';
      const expected = [0x01020304, 0x02030405, 0x02030405, 0xffffffff];
      doIntTest(token).should.eql(expected);
    });

    const doFloatDoubleTest = (token, exp1, exp2, exp3) => {
      const bufSize = token.slice(0, 5) === 'float' ? 4 : 8;
      const bufs = {};
      bufs.LE = Buffer.alloc(bufSize);
      bufs.BE = Buffer.alloc(bufSize);
      const value = 1234.5678;
      const margin = 0.0001;
      if (bufSize === 4) {
        bufs.LE.writeFloatLE(value);
        bufs.BE.writeFloatBE(value);
      } else {
        bufs.LE.writeDoubleLE(value);
        bufs.BE.writeDoubleBE(value);
      }

      _readByToken(bufs[exp1], 0, token).should.be
        .within(value - margin, value + margin, 'without endian');
      _readByToken(bufs[exp2], 0, token, 'LE').should.be
        .within(value - margin, value + margin, 'with LE');
      _readByToken(bufs[exp3], 0, token, 'BE').should.be
        .within(value - margin, value + margin, 'with BE');
    };

    it('should read `float`', () => {
      const token = 'float';
      doFloatDoubleTest(token, 'LE', 'LE', 'BE');
    });
    it('should read `floatLE`', () => {
      const token = 'floatLE';
      doFloatDoubleTest(token, 'LE', 'LE', 'LE');
    });
    it('should read `floatBE`', () => {
      const token = 'floatBE';
      doFloatDoubleTest(token, 'BE', 'BE', 'BE');
    });
    it('should read `double`', () => {
      const token = 'double';
      doFloatDoubleTest(token, 'LE', 'LE', 'BE');
    });
    it('should read `doubleLE`', () => {
      const token = 'doubleLE';
      doFloatDoubleTest(token, 'LE', 'LE', 'LE');
    });
    it('should read `doubleBE`', () => {
      const token = 'doubleBE';
      doFloatDoubleTest(token, 'BE', 'BE', 'BE');
    });

    it('should throw RangeError when buf is not enough', () => {
      const doTest = () => _readByToken(buf12, 0, 'uint32');
      doTest.should.throw(RangeError);
    });
  });

  describe('_getValueSize()', () => {
    const _getValueSize = binflow._getValueSize;

    it('should get value size of normal tokens', () => {
      const keys = Object.keys(binflow.VALUE_SIZE);
      keys.map((key, idx) =>
        _getValueSize(tokensNE[idx]).should.eql(binflow.VALUE_SIZE[key]));
    });
    it('should get value size of LE tokens', () => {
      const keys = Object.keys(binflow.VALUE_SIZE);
      keys.map((key, idx) =>
        _getValueSize(tokensLE[idx]).should.eql(binflow.VALUE_SIZE[key]));
    });
    it('should get value size of BE tokens', () => {
      const keys = Object.keys(binflow.VALUE_SIZE);
      keys.map((key, idx) =>
        _getValueSize(tokensBE[idx]).should.eql(binflow.VALUE_SIZE[key]));
    });
  });
});
