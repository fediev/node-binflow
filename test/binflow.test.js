/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const typesNE = binflow.NE_TYPES; // tokens with No Endian
const typesLE = typesNE.map((token) => `${token}LE`);
const typesBE = typesNE.map((token) => `${token}BE`);

const buf12 = Buffer.from('0102', 'hex');
const buf1234 = Buffer.from('0102030405060708090a', 'hex');
const bufffff = Buffer.from('ffffffffffffffff', 'hex');
const bufff12 = Buffer.from('ffffffffffffffffffffffff', 'hex');

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

    it('should get false on NE types', () => {
      typesNE.forEach((type) => {
        _hasEndian(type).should.be.false;
      });
    });
    it('should get true on LE types', () => {
      typesLE.forEach((type) => {
        _hasEndian(type).should.be.true;
      });
    });
    it('should get true on BE types', () => {
      typesBE.forEach((type) => {
        _hasEndian(type).should.be.true;
      });
    });
  });

  describe('_getNeType()', () => {
    const _getNeType = binflow._getNeType;

    it('should get type on NE types', () => {
      typesNE.forEach((type) => {
        _getNeType(type).should.eql(type);
      });
    });
    it('should get types on LE types', () => {
      typesLE.forEach((type, idx) => {
        _getNeType(type).should.eql(binflow.NE_TYPES[idx]);
      });
    });
    it('should get types on BE types', () => {
      typesBE.forEach((type, idx) => {
        _getNeType(type).should.eql(binflow.NE_TYPES[idx]);
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
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
    it('should throw on `byte` string token', () => {
      const stru = {
        prop1: 'byte',
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
    it('should throw on `string` string token', () => {
      const stru = {
        prop1: 'string',
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
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
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
    it('should throw on wrong array count', () => {
      const stru = {
        prop1: ['int8', '_NOT_NUMBER_'],
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
    it('should throw on wrong array token without count', () => {
      const stru = {
        prop1: ['int8'],
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
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
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
    it('should throw on invalid nested object token', () => {
      const stru = {
        prop1: {
          subprop1: {
            aa: '_INVALID_TOKEN_',
          },
        },
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });

    it('should throw on not supporte token type', () => {
      const stru = {
        prop1: 1,
      };
      const doTest = () => _validateStructure(stru);
      doTest.should.throw();
    });
  });

  // eslint-disable-next-line max-statements
  describe('_readByType()', () => {
    const _readByType = binflow._readByType;

    const doIntTest = (type) => {
      const result = [];
      result.push(_readByType(buf1234, 0, type));
      result.push(_readByType(buf1234, 1, type, 'LE'));
      result.push(_readByType(buf1234, 1, type, 'BE'));
      result.push(_readByType(bufffff, 0, type));
      return result;
    };

    it('should read `int8`', () => {
      const type = 'int8';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int8LE`', () => {
      const type = 'int8LE';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int8BE`', () => {
      const type = 'int8BE';
      const expected = [0x01, 0x02, 0x02, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int16', () => {
      const type = 'int16';
      const expected = [0x0201, 0x0302, 0x0203, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int16LE', () => {
      const type = 'int16LE';
      const expected = [0x0201, 0x0302, 0x0302, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int16BE', () => {
      const type = 'int16BE';
      const expected = [0x0102, 0x0203, 0x0203, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int32', () => {
      const type = 'int32';
      const expected = [0x04030201, 0x05040302, 0x02030405, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int32LE', () => {
      const type = 'int32LE';
      const expected = [0x04030201, 0x05040302, 0x05040302, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int32BE', () => {
      const type = 'int32BE';
      const expected = [0x01020304, 0x02030405, 0x02030405, -1];
      doIntTest(type).should.eql(expected);
    });

    it('should read `uint8`', () => {
      const type = 'uint8';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint8LE`', () => {
      const type = 'uint8LE';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint8BE`', () => {
      const type = 'uint8BE';
      const expected = [0x01, 0x02, 0x02, 0xff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint16', () => {
      const type = 'uint16';
      const expected = [0x0201, 0x0302, 0x0203, 0xffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint16LE', () => {
      const type = 'uint16LE';
      const expected = [0x0201, 0x0302, 0x0302, 0xffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint16BE', () => {
      const type = 'uint16BE';
      const expected = [0x0102, 0x0203, 0x0203, 0xffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint32', () => {
      const type = 'uint32';
      const expected = [0x04030201, 0x05040302, 0x02030405, 0xffffffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint32LE', () => {
      const type = 'uint32LE';
      const expected = [0x04030201, 0x05040302, 0x05040302, 0xffffffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint32BE', () => {
      const type = 'uint32BE';
      const expected = [0x01020304, 0x02030405, 0x02030405, 0xffffffff];
      doIntTest(type).should.eql(expected);
    });

    const doFloatDoubleTest = (type, exp1, exp2, exp3) => {
      const bufSize = type.slice(0, 5) === 'float' ? 4 : 8;
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

      _readByType(bufs[exp1], 0, type).should.be
        .within(value - margin, value + margin, 'without endian');
      _readByType(bufs[exp2], 0, type, 'LE').should.be
        .within(value - margin, value + margin, 'with LE');
      _readByType(bufs[exp3], 0, type, 'BE').should.be
        .within(value - margin, value + margin, 'with BE');
    };

    it('should read `float`', () => {
      const type = 'float';
      doFloatDoubleTest(type, 'LE', 'LE', 'BE');
    });
    it('should read `floatLE`', () => {
      const type = 'floatLE';
      doFloatDoubleTest(type, 'LE', 'LE', 'LE');
    });
    it('should read `floatBE`', () => {
      const type = 'floatBE';
      doFloatDoubleTest(type, 'BE', 'BE', 'BE');
    });
    it('should read `double`', () => {
      const type = 'double';
      doFloatDoubleTest(type, 'LE', 'LE', 'BE');
    });
    it('should read `doubleLE`', () => {
      const type = 'doubleLE';
      doFloatDoubleTest(type, 'LE', 'LE', 'LE');
    });
    it('should read `doubleBE`', () => {
      const type = 'doubleBE';
      doFloatDoubleTest(type, 'BE', 'BE', 'BE');
    });

    it('should throw RangeError when buf is not enough', () => {
      const doTest = () => _readByType(buf12, 0, 'uint32');
      doTest.should.throw(RangeError);
    });
  });

  // eslint-disable-next-line max-statements
  describe('_writeByType()', () => {
    const _writeByType = binflow._writeByType;

    const doIntTest = (token, expecteds) => {
      const vals = [0, 1, 2, -1];
      const offsets = [0, 1, 2, 0];
      // eslint-disable-next-line no-undefined
      const endians = [undefined, 'LE', 'BE', undefined];

      expecteds.forEach((expected, idx) => {
        const val = vals[idx];
        const buf = Buffer.from(bufffff);
        const offset = offsets[idx];
        const endian = endians[idx];
        _writeByType(val, buf, offset, token, endian);
        buf.should.be.eql(expected);
      });
    };

    it('should write `int8`', () => {
      const token = 'int8';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int8LE`', () => {
      const token = 'int8LE';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int8BE`', () => {
      const token = 'int8BE';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int16`', () => {
      const token = 'int16';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0100ffffffffff', 'hex'),
        Buffer.from('ffff0002ffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int16LE`', () => {
      const token = 'int16LE';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0100ffffffffff', 'hex'),
        Buffer.from('ffff0200ffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int16BE`', () => {
      const token = 'int16BE';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0001ffffffffff', 'hex'),
        Buffer.from('ffff0002ffffffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int32`', () => {
      const token = 'int32';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff01000000ffffff', 'hex'),
        Buffer.from('ffff00000002ffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int32LE`', () => {
      const token = 'int32LE';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff01000000ffffff', 'hex'),
        Buffer.from('ffff02000000ffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `int32BE`', () => {
      const token = 'int32BE';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff00000001ffffff', 'hex'),
        Buffer.from('ffff00000002ffff', 'hex'),
        Buffer.from('ffffffffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint8`', () => {
      const token = 'uint8';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint8LE`', () => {
      const token = 'uint8LE';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint8BE`', () => {
      const token = 'uint8BE';
      const expecteds = [
        Buffer.from('00ffffffffffffff', 'hex'),
        Buffer.from('ff01ffffffffffff', 'hex'),
        Buffer.from('ffff02ffffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint16`', () => {
      const token = 'uint16';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0100ffffffffff', 'hex'),
        Buffer.from('ffff0002ffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint16LE`', () => {
      const token = 'uint16LE';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0100ffffffffff', 'hex'),
        Buffer.from('ffff0200ffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint16BE`', () => {
      const token = 'uint16BE';
      const expecteds = [
        Buffer.from('0000ffffffffffff', 'hex'),
        Buffer.from('ff0001ffffffffff', 'hex'),
        Buffer.from('ffff0002ffffffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint32`', () => {
      const token = 'uint32';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff01000000ffffff', 'hex'),
        Buffer.from('ffff00000002ffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint32LE`', () => {
      const token = 'uint32LE';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff01000000ffffff', 'hex'),
        Buffer.from('ffff02000000ffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });
    it('should write `uint32BE`', () => {
      const token = 'uint32BE';
      const expecteds = [
        Buffer.from('00000000ffffffff', 'hex'),
        Buffer.from('ff00000001ffffff', 'hex'),
        Buffer.from('ffff00000002ffff', 'hex'),
      ];
      doIntTest(token, expecteds);
    });

    const floatValue = 1234.5678;
    const doFloatDoubleTest = (token, expecteds) => {
      const offsets = [0, 1, 2];
      // eslint-disable-next-line no-undefined
      const endians = [undefined, 'LE', 'BE'];

      expecteds.forEach((expected, idx) => {
        const val = floatValue;
        const buf = Buffer.from(bufff12);
        const offset = offsets[idx];
        const endian = endians[idx];
        _writeByType(val, buf, offset, token, endian);
        buf.should.be.eql(expected, 'with endian' + endian);
      });
    };

    // TODO: refactoring
    it('should write `float`', () => {
      const token = 'float';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeFloatLE(floatValue, 0);
      bufLE.writeFloatLE(floatValue, 1);
      bufBE.writeFloatBE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
    it('should write `floatLE`', () => {
      const token = 'floatLE';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeFloatLE(floatValue, 0);
      bufLE.writeFloatLE(floatValue, 1);
      bufBE.writeFloatLE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
    it('should write `floatBE`', () => {
      const token = 'floatBE';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeFloatBE(floatValue, 0);
      bufLE.writeFloatBE(floatValue, 1);
      bufBE.writeFloatBE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
    it('should write `double`', () => {
      const token = 'double';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeDoubleLE(floatValue, 0);
      bufLE.writeDoubleLE(floatValue, 1);
      bufBE.writeDoubleBE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
    it('should write `doubleLE`', () => {
      const token = 'doubleLE';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeDoubleLE(floatValue, 0);
      bufLE.writeDoubleLE(floatValue, 1);
      bufBE.writeDoubleLE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
    it('should write `doubleBE`', () => {
      const token = 'doubleBE';
      const bufNE = Buffer.from(bufff12);
      const bufLE = Buffer.from(bufff12);
      const bufBE = Buffer.from(bufff12);
      bufNE.writeDoubleBE(floatValue, 0);
      bufLE.writeDoubleBE(floatValue, 1);
      bufBE.writeDoubleBE(floatValue, 2);
      const expecteds = [bufNE, bufLE, bufBE];
      doFloatDoubleTest(token, expecteds);
    });
  });

  describe('_getValueSize()', () => {
    const _getValueSize = binflow._getValueSize;

    const sizes = {
      int8: 1,
      int16: 2,
      int24: 3,
      int32: 4,
      int64: 8,
      uint8: 1,
      uint16: 2,
      uint24: 3,
      uint32: 4,
      uint64: 8,
      'float': 4,
      'double': 8,
      'byte': 1,
      string: 1,
    };

    it('should get value size of normal tokens', () => {
      binflow.NE_TYPES.forEach((type) => {
        const token = type;
        _getValueSize(token).should.eql(sizes[type]);
      });
    });
    it('should get value size of LE tokens', () => {
      binflow.NE_TYPES.forEach((type) => {
        const token = type + 'LE';
        _getValueSize(token).should.eql(sizes[type]);
      });
    });
    it('should get value size of BE tokens', () => {
      binflow.NE_TYPES.forEach((type) => {
        const token = type + 'BE';
        _getValueSize(token).should.eql(sizes[type]);
      });
    });
  });

  describe('_getTokenOffsetOfField()', () => {
    const _getTokenOffsetOfField = binflow._getTokenOffsetOfField;
    const stru = {
      prop1: 'int8',                // 1
      prop2: 'int32LE',             // 4
      prop3: ['int16BE', 4],        // 8 = 2 * 4
      prop4: ['byte', 12],          // 12 = 1 * 12
      prop5: {
        subprop1: 'uint8',          // 1
        subprop2: ['string', 20],   // 20 = 1 * 20
        subprop3: 'uint16LE',       // 2
        subprop4: {
          subsubprop1: 'int32',     // 4
          subsubprop2: 'uint16LE',  // 2
        },
      },
      prop6: 'uint32',              // 4
    };

    it('should get info of string token field', () => {
      const field = 'prop2';
      const result = _getTokenOffsetOfField(stru, field);
      result.token.should.eql(stru[field], 'token');
      result.offset.should.eql(1, 'offset');
    });
    it('should get info of array token field', () => {
      const field = 'prop3';
      const result = _getTokenOffsetOfField(stru, field);
      result.token.should.eql(stru[field], 'token');
      result.offset.should.eql(5, 'offset');
    });
    it('should get info of object token field', () => {
      const field = 'prop5';
      const result = _getTokenOffsetOfField(stru, field);
      result.token.should.eql(stru[field], 'token');
      result.offset.should.eql(25, 'offset');
    });
    it('should get info of sub field', () => {
      const field = 'subprop3';
      const result = _getTokenOffsetOfField(stru, field);
      result.token.should.eql(stru.prop5[field], 'token');
      result.offset.should.eql(46, 'offset');
    });
    it('should get info of sub sub field', () => {
      const field = 'subsubprop2';
      const result = _getTokenOffsetOfField(stru, field);
      result.token.should.eql(stru.prop5.subprop4[field], 'token');
      result.offset.should.eql(52, 'offset');
    });
  });

  describe('_getStructureSize()', () => {
    it('should get structure byte size', () => {
      const stru = {
        prop1: 'int8',                // 1
        prop2: 'int32LE',             // 4
        prop3: ['int16BE', 4],        // 8 = 2 * 4
        prop4: ['byte', 12],          // 12 = 1 * 12
        prop5: {
          subprop1: 'uint8',          // 1
          subprop2: ['string', 20],   // 20 = 1 * 20
          subprop3: 'uint16LE',       // 2
          subprop4: {
            subsubprop1: 'int32',     // 4
            subsubprop2: 'uint16LE',  // 2
          },
        },
        prop6: 'uint32',              // 4
      };
      binflow._getStructureSize(stru).should.eql(58);
    });
    it('should get 0 on empty structure', () => {
      const stru = {};
      binflow._getStructureSize(stru).should.eql(0);
    });
  });
});
