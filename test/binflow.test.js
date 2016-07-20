/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const tokensNE = binflow.TYPES; // tokens with No Endian
const tokensLE = tokensNE.map((token) => `${token}LE`);
const tokensBE = tokensNE.map((token) => `${token}BE`);
// const tokensAll = [...tokens, ...tokensLE, ...tokensBE];
const buf1234 = Buffer.from('0102030405060708090a', 'hex');
const bufffff = Buffer.from('ffffffffffffffff', 'hex');

describe('Binflow', () => {
  describe('createBinflow()', () => {
    it('should create a binflow object', () => {
      const result = binflow.createBinflow();
      result.should.be.an('object');
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
