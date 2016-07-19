module.exports.createBinflow = function createBinflow(stru, endian = 'LE') {
//  let _endian = endian;

  function struct() {
    //
  }

  function setEndian() {
    //
  }

  function parse() {
    //
  }

  function encode() {
    //
  }

  function set() {
    //
  }

  function get() {
    //
  }

  function _hasEndian(token) {
    const tail = token.slice(-2);

    return tail === 'LE' || tail === 'BE';
  }

  function _removeTail(token) {
    return _hasEndian(token) ? token.slice(0, -2) : token;
  }

  return {
    struct,
    setEndian,
    parse,
    encode,
    set,
    get,
    _hasEndian,
    _removeTail,
  };
};
