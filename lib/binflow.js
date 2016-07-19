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

  return {
    struct,
    setEndian,
    parse,
    encode,
    set,
    get,
    _hasEndian,
  };
};
