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
});
