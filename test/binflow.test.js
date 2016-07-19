/* eslint-disable no-unused-expressions */
const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

const tokens = [
  'double',
  'float',
  'int8',
  'int16',
  'int32',
  'uint8',
  'unit16',
  'uint32',
  'char',
  'string',
];

const tokensLE = tokens.map((token) => `${token}LE`);
const tokensBE = tokens.map((token) => `${token}BE`);
// const tokensAll = [...tokens, ...tokensLE, ...tokensBE];

describe('binflow', () => {
  describe('createBinflow()', () => {
    it('should create a binflow object', () => {
      const result = binflow.createBinflow();
      result.should.be.an('object');
    });
  });
  describe('_hasEndian()', () => {
    const _hasEndian = binflow.createBinflow()._hasEndian;

    it('should get false on normal tokens', () => {
      tokens.forEach((token) => {
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
  describe('_removeTail()', () => {
    const _removeTail = binflow.createBinflow()._removeTail;

    it('should get unchaned on normal tokens', () => {
      tokens.forEach((token) => {
        _removeTail(token).should.eql(token);
      });
    });
    it('should get true on endian-tailed tokens', () => {
      tokensLE.forEach((token, idx) => {
        _removeTail(token).should.eql(tokens[idx]);
      });
      tokensBE.forEach((token, idx) => {
        _removeTail(token).should.eql(tokens[idx]);
      });
    });
  });
  describe('parse()', () => {
    it('should parse int with defalut endian(LE)', () => {
      const buf = Buffer.from([0x01, 0xff, 0x03, 0x04, 0x05, 0x06]);
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const expected = {
        prop1: 0x01,
        prop2: -1,
        prop3: 0x06050403,
      };
      const bnf = binflow.createBinflow(stru);
      const result = bnf.parse(buf);
      result.should.eql(expected);
    });
    it('should parse int with little endian', () => {
      const buf = Buffer.from([0x01, 0xff, 0x03, 0x04, 0x05, 0x06]);
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const endian = 'LE';
      const expected = {
        prop1: 0x01,
        prop2: -1,
        prop3: 0x06050403,
      };
      const bnf = binflow.createBinflow(stru, endian);
      const result = bnf.parse(buf);
      result.should.eql(expected);
    });
    it('should parse int with big endian', () => {
      const buf = Buffer.from([0x01, 0xff, 0x03, 0x04, 0x05, 0x06]);
      const stru = {
        prop1: 'uint8',
        prop2: 'int8',
        prop3: 'int32',
      };
      const endian = 'BE';
      const expected = {
        prop1: 0x01,
        prop2: -1,
        prop3: 0x03040506,
      };
      const bnf = binflow.createBinflow(stru, endian);
      const result = bnf.parse(buf);
      result.should.eql(expected);
    });
  });
});
