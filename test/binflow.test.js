const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const binflow = require('../lib/binflow');

describe('binflow', () => {
  describe('createBinflow()', () => {
    it('should create a binflow object', () => {
      const result = binflow.createBinflow();
      result.should.be.an('object');
    });
  });
});
