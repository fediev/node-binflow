/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');
const fullSpecStructure = require('./fullSpecStructure');

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
    it('should set endian correctly with in-structure endian setting', () => {
      const expected = 'BE';
      const bnf = binflow.createBinflow({ $endian: expected });
      const result = bnf.getEndian();
      result.should.eql(expected);
    });
    it('should override LE in-structure endian with BE endian param', () => {
      const expected = 'BE';
      const bnf = binflow.createBinflow({ $endian: 'LE' }, expected);
      const result = bnf.getEndian();
      result.should.eql(expected);
    });
    it('should override BE in-structure endian with LE endian param', () => {
      const expected = 'LE';
      const bnf = binflow.createBinflow({ $endian: 'BE' }, expected);
      const result = bnf.getEndian();
      result.should.eql(expected);
    });

    it('should create a binflow object on full spec structure', () => {
      const result = binflow.createBinflow(fullSpecStructure);
      result.should.respondTo('parse');
    });
  });

  describe('_hasEndian()', () => {
    const _hasEndian = binflow._hasEndian;

    it('should get false on NE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _hasEndian(type).should.be.false;
      });
    });
    it('should get true on LE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _hasEndian(type + 'LE').should.be.true;
      });
    });
    it('should get true on BE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _hasEndian(type + 'BE').should.be.true;
      });
    });
  });

  describe('_getNeType()', () => {
    const _getNeType = binflow._getNeType;

    it('should get type on NE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getNeType(type).should.eql(type);
      });
    });
    it('should get types on LE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getNeType(type + 'LE').should.eql(type);
      });
    });
    it('should get types on BE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getNeType(type + 'BE').should.eql(type);
      });
    });
  });

  describe('_getPrimaryType()', () => {
    const _getPrimaryType = binflow._getPrimaryType;
    const ptypes = {
      int8: 'int',
      int16: 'int',
      int24: 'int',
      int32: 'int',
      int64: 'int',
      uint8: 'uint',
      uint16: 'uint',
      uint24: 'uint',
      uint32: 'uint',
      uint64: 'uint',
      'float': 'float',
      'double': 'double',
      'byte': 'byte',
      string: 'string',
    };

    it('should get primary type on NE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getPrimaryType(type).should.eql(ptypes[type]);
      });
    });
    it('should get types on LE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getPrimaryType(type + 'LE').should.eql(ptypes[type]);
      });
    });
    it('should get types on BE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getPrimaryType(type + 'BE').should.eql(ptypes[type]);
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

    it('should return true on `$endian` key', () => {
      const stru = {
        prop1: 'int8',
        $endian: 'LE',
        prop2: 'int8',
      };
      _validateStructure(stru).should.be.true;
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

    it('should return true on full spec structure', () => {
      const result = _validateStructure(fullSpecStructure);
      result.should.be.true;
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
    it('should read `int24', () => {
      const type = 'int24';
      const expected = [0x030201, 0x040302, 0x020304, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int24LE', () => {
      const type = 'int24LE';
      const expected = [0x030201, 0x040302, 0x040302, -1];
      doIntTest(type).should.eql(expected);
    });
    it('should read `int24BE', () => {
      const type = 'int24BE';
      const expected = [0x010203, 0x020304, 0x020304, -1];
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
    // buf.readIntLE, readIntBE supports up to 48 bits of accuracy
    it('should read `int64', () => {
      const type = 'int64';
      const expected = [
        0x0807060504030201, 0x0908070605040302, 0x0203040506070809,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
    });
    it('should read `int64LE', () => {
      const type = 'int64LE';
      const expected = [
        0x0807060504030201, 0x0908070605040302, 0x0908070605040302,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
    });
    it('should read `int64BE', () => {
      const type = 'int64BE';
      const expected = [
        0x0102030405060708, 0x0203040506070809, 0x0203040506070809,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
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
    it('should read `uint24', () => {
      const type = 'uint24';
      const expected = [0x030201, 0x040302, 0x020304, 0xffffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint24LE', () => {
      const type = 'uint24LE';
      const expected = [0x030201, 0x040302, 0x040302, 0xffffff];
      doIntTest(type).should.eql(expected);
    });
    it('should read `uint24BE', () => {
      const type = 'uint24BE';
      const expected = [0x010203, 0x020304, 0x020304, 0xffffff];
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
    // buf.readIntLE, readIntBE supports up to 48 bits of accuracy
    it('should read `uint64', () => {
      const type = 'uint64';
      const expected = [
        0x0807060504030201, 0x0908070605040302, 0x0203040506070809,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
    });
    it('should read `uint64LE', () => {
      const type = 'uint64LE';
      const expected = [
        0x0807060504030201, 0x0908070605040302, 0x0908070605040302,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
    });
    it('should read `uint64BE', () => {
      const type = 'uint64BE';
      const expected = [
        0x0102030405060708, 0x0203040506070809, 0x0203040506070809,
      ];
      doIntTest(type).slice(0, 3).should.eql(expected);
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

    const doIntTest = (type, expecteds, isLong) => {
      const vals = [1, 2, 3, -1];
      const offsets = [0, 1, 2, 0];
      // eslint-disable-next-line no-undefined
      const endians = [undefined, 'LE', 'BE', undefined];
      const expectedBufs = expecteds.map((hex) => {
        return Buffer.from(hex, 'hex');
      });

      expectedBufs.forEach((expected, idx) => {
        const val = vals[idx];
        const buf = Buffer.from(isLong ? bufff12 : bufffff);
        const offset = offsets[idx];
        const endian = endians[idx];
        _writeByType(val, buf, offset, type, endian);
        buf.should.be.eql(expected);
      });
    };

    it('should write `int8`', () => {
      const type = 'int8';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int8LE`', () => {
      const type = 'int8LE';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int8BE`', () => {
      const type = 'int8BE';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int16`', () => {
      const type = 'int16';
      const expecteds = [
        '0100ffffffffffff',
        'ff0200ffffffffff',
        'ffff0003ffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int16LE`', () => {
      const type = 'int16LE';
      const expecteds = [
        '0100ffffffffffff',
        'ff0200ffffffffff',
        'ffff0300ffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int16BE`', () => {
      const type = 'int16BE';
      const expecteds = [
        '0001ffffffffffff',
        'ff0002ffffffffff',
        'ffff0003ffffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int24`', () => {
      const type = 'int24';
      const expecteds = [
        '010000ffffffffff',
        'ff020000ffffffff',
        'ffff000003ffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int24LE`', () => {
      const type = 'int24LE';
      const expecteds = [
        '010000ffffffffff',
        'ff020000ffffffff',
        'ffff030000ffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int24BE`', () => {
      const type = 'int24BE';
      const expecteds = [
        '000001ffffffffff',
        'ff000002ffffffff',
        'ffff000003ffffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int32`', () => {
      const type = 'int32';
      const expecteds = [
        '01000000ffffffff',
        'ff02000000ffffff',
        'ffff00000003ffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int32LE`', () => {
      const type = 'int32LE';
      const expecteds = [
        '01000000ffffffff',
        'ff02000000ffffff',
        'ffff03000000ffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int32BE`', () => {
      const type = 'int32BE';
      const expecteds = [
        '00000001ffffffff',
        'ff00000002ffffff',
        'ffff00000003ffff',
        'ffffffffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `int64`', () => {
      const type = 'int64';
      const expecteds = [
        '0100000000000000ffffffff',
        'ff0200000000000000ffffff',
        'ffff0000000000000003ffff',
        'ffffffffffffffffffffffff',
      ];
      doIntTest(type, expecteds, true);
    });
    it('should write `int64LE`', () => {
      const type = 'int64LE';
      const expecteds = [
        '0100000000000000ffffffff',
        'ff0200000000000000ffffff',
        'ffff0300000000000000ffff',
        'ffffffffffffffffffffffff',
      ];
      doIntTest(type, expecteds, true);
    });
    it('should write `int64BE`', () => {
      const type = 'int64BE';
      const expecteds = [
        '0000000000000001ffffffff',
        'ff0000000000000002ffffff',
        'ffff0000000000000003ffff',
        'ffffffffffffffffffffffff',
      ];
      doIntTest(type, expecteds, true);
    });
    it('should write `uint8`', () => {
      const type = 'uint8';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint8LE`', () => {
      const type = 'uint8LE';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint8BE`', () => {
      const type = 'uint8BE';
      const expecteds = [
        '01ffffffffffffff',
        'ff02ffffffffffff',
        'ffff03ffffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint16`', () => {
      const type = 'uint16';
      const expecteds = [
        '0100ffffffffffff',
        'ff0200ffffffffff',
        'ffff0003ffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint16LE`', () => {
      const type = 'uint16LE';
      const expecteds = [
        '0100ffffffffffff',
        'ff0200ffffffffff',
        'ffff0300ffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint16BE`', () => {
      const type = 'uint16BE';
      const expecteds = [
        '0001ffffffffffff',
        'ff0002ffffffffff',
        'ffff0003ffffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint24`', () => {
      const type = 'uint24';
      const expecteds = [
        '010000ffffffffff',
        'ff020000ffffffff',
        'ffff000003ffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint24LE`', () => {
      const type = 'uint24LE';
      const expecteds = [
        '010000ffffffffff',
        'ff020000ffffffff',
        'ffff030000ffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint24BE`', () => {
      const type = 'uint24BE';
      const expecteds = [
        '000001ffffffffff',
        'ff000002ffffffff',
        'ffff000003ffffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint32`', () => {
      const type = 'uint32';
      const expecteds = [
        '01000000ffffffff',
        'ff02000000ffffff',
        'ffff00000003ffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint32LE`', () => {
      const type = 'uint32LE';
      const expecteds = [
        '01000000ffffffff',
        'ff02000000ffffff',
        'ffff03000000ffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint32BE`', () => {
      const type = 'uint32BE';
      const expecteds = [
        '00000001ffffffff',
        'ff00000002ffffff',
        'ffff00000003ffff',
      ];
      doIntTest(type, expecteds);
    });
    it('should write `uint64`', () => {
      const type = 'uint64';
      const expecteds = [
        '0100000000000000ffffffff',
        'ff0200000000000000ffffff',
        'ffff0000000000000003ffff',
      ];
      doIntTest(type, expecteds, true);
    });
    it('should write `uint64LE`', () => {
      const type = 'uint64LE';
      const expecteds = [
        '0100000000000000ffffffff',
        'ff0200000000000000ffffff',
        'ffff0300000000000000ffff',
      ];
      doIntTest(type, expecteds, true);
    });
    it('should write `uint64BE`', () => {
      const type = 'uint64BE';
      const expecteds = [
        '0000000000000001ffffffff',
        'ff0000000000000002ffffff',
        'ffff0000000000000003ffff',
      ];
      doIntTest(type, expecteds, true);
    });

    const doFloatDoubleTest = (type, expecteds) => {
      const writers = {
        FLE: Buffer.prototype.writeFloatLE,
        FBE: Buffer.prototype.writeFloatBE,
        DLE: Buffer.prototype.writeDoubleLE,
        DBE: Buffer.prototype.writeDoubleBE,
      };
      const floatValue = 1234.5678;
      const offsets = [0, 1, 2];
      // eslint-disable-next-line no-undefined
      const endians = [undefined, 'LE', 'BE'];
      const expectedBufs = expecteds.map((writer, idx) => {
        const buf = Buffer.from(bufff12);
        writers[writer].call(buf, floatValue, offsets[idx]);
        return buf;
      });

      expectedBufs.forEach((expected, idx) => {
        const val = floatValue;
        const buf = Buffer.from(bufff12);
        const offset = offsets[idx];
        const endian = endians[idx];
        _writeByType(val, buf, offset, type, endian);
        buf.should.be.eql(expected, 'with endian ' + endian);
      });
    };

    it('should write `float`', () => {
      const type = 'float';
      const expecteds = ['FLE', 'FLE', 'FBE'];
      doFloatDoubleTest(type, expecteds);
    });
    it('should write `floatLE`', () => {
      const type = 'floatLE';
      const expecteds = ['FLE', 'FLE', 'FLE'];
      doFloatDoubleTest(type, expecteds);
    });
    it('should write `floatBE`', () => {
      const type = 'floatBE';
      const expecteds = ['FBE', 'FBE', 'FBE'];
      doFloatDoubleTest(type, expecteds);
    });
    it('should write `double`', () => {
      const type = 'double';
      const expecteds = ['DLE', 'DLE', 'DBE'];
      doFloatDoubleTest(type, expecteds);
    });
    it('should write `doubleLE`', () => {
      const type = 'doubleLE';
      const expecteds = ['DLE', 'DLE', 'DLE'];
      doFloatDoubleTest(type, expecteds);
    });
    it('should write `doubleBE`', () => {
      const type = 'doubleBE';
      const expecteds = ['DBE', 'DBE', 'DBE'];
      doFloatDoubleTest(type, expecteds);
    });

    it('should not write when value is undefined', () => {
      // eslint-disable-next-line no-undefined
      const value = undefined;
      const buf = Buffer.from('ffffffff', 'hex');
      const expected = Buffer.from(buf);
      _writeByType(value, buf, 0, 'int32');
      buf.should.eql(expected);
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

    it('should get value size of NE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getValueSize(type).should.eql(sizes[type]);
      });
    });
    it('should get value size of LE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getValueSize(type + 'LE').should.eql(sizes[type]);
      });
    });
    it('should get value size of BE types', () => {
      binflow.NE_TYPES.forEach((type) => {
        _getValueSize(type + 'BE').should.eql(sizes[type]);
      });
    });

    it('should get structure size when object is passed as type', () => {
      const type = {
        prop1: 'int32',
        prop2: ['int16', 5],
      };
      const expected = 14;
      _getValueSize(type).should.eql(expected);
    });
  });

  describe('_getTokenOffsetOfField()', () => {
    const _getTokenOffsetOfField = binflow._getTokenOffsetOfField;

    it('should get info of string token field', () => {
      const field = 'prop2';
      const result = _getTokenOffsetOfField(fullSpecStructure, field);
      const expected = fullSpecStructure[field];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(2, 'offset');
    });
    it('should get info of array token field', () => {
      const field = 'prop3';
      const result = _getTokenOffsetOfField(fullSpecStructure, field);
      const expected = fullSpecStructure[field];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(3, 'offset');
    });
    it('should get info of object token field', () => {
      const field = 'prop8';
      const result = _getTokenOffsetOfField(fullSpecStructure, field);
      const expected = fullSpecStructure[field];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(34, 'offset');
    });
    it('should get info of sub field', () => {
      const field = 'subprop3';
      const result = _getTokenOffsetOfField(fullSpecStructure, field);
      const expected = fullSpecStructure.prop8[field];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(46, 'offset');
    });
    it('should get info of sub sub field', () => {
      const field = 'subsubprop2';
      const result = _getTokenOffsetOfField(fullSpecStructure, field);
      const expected = fullSpecStructure.prop8.subprop6[field];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(63, 'offset');
    });

    it('should get info of array item token field', () => {
      const field = 'prop3';
      const subfield = 1;
      const result = _getTokenOffsetOfField(fullSpecStructure, field, subfield);
      const expected = fullSpecStructure[field][0];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(5, 'offset');
    });
    it('should get info of object array item token field', () => {
      const field = 'prop6';
      const subfield = 2;
      const result = _getTokenOffsetOfField(fullSpecStructure, field, subfield);
      const expected = fullSpecStructure[field][0];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(26, 'offset');
    });
    it('should throw RangeError when array item index is overflow', () => {
      const field = 'prop3';
      const subfield = 3;
      const doTest = () => {
        _getTokenOffsetOfField(fullSpecStructure, field, subfield);
      };
      doTest.should.throw(RangeError);
    });
    it('should get info of object child field', () => {
      const field = 'prop9';
      const subfield = 'sub2prop2';
      const result = _getTokenOffsetOfField(fullSpecStructure, field, subfield);
      const expected = fullSpecStructure[field][subfield];
      result.token.should.eql(expected, 'token');
      result.offset.should.eql(70, 'offset');
    });
    it('should throw RangeError when object child does not exist', () => {
      const field = 'prop9';
      const subfield = '_NOT_EXIST_';
      const doTest = () => {
        _getTokenOffsetOfField(fullSpecStructure, field, subfield);
      };
      doTest.should.throw(RangeError);
    });

    it('should get size of structue without field', () => {
      const result = _getTokenOffsetOfField(fullSpecStructure);
      result.offset.should.eql(77, 'offset');
    });

    it('should ignore `$endian`', () => {
      const struWithEndian = {
        prop1: 'int16',
        $endian: 'BE',
        prop2: 'uin32',
      };
      const field = 'prop2';
      const result = _getTokenOffsetOfField(struWithEndian, field);
      result.token.should.eql(struWithEndian[field], 'token');
      result.offset.should.eql(2, 'offset');
    });
  });

  describe('_getStructureSize()', () => {
    it('should get structure byte size', () => {
      binflow._getStructureSize(fullSpecStructure).should.eql(77);
    });
    it('should get 0 on empty structure', () => {
      const stru = {};
      binflow._getStructureSize(stru).should.eql(0);
    });
  });
});
