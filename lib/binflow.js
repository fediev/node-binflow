const TYPES = [
  'int8',
  'int16',
  'int32',
  'uint8',
  'uint16',
  'uint32',
  'double',
  'float',
  'byte',
  'string',
];

const TOKEN_SIZE = {
  int8: 1,
  int16: 2,
  int32: 4,
  uint8: 1,
  uint16: 2,
  uint32: 4,
  'double': 8,
  'float': 4,
  'byte': 0,
  string: 0,
};

const READERS = {
  LE: {
    int8: Buffer.prototype.readInt8,
    int16: Buffer.prototype.readInt16LE,
    int32: Buffer.prototype.readInt32LE,
    uint8: Buffer.prototype.readUInt8,
    uint16: Buffer.prototype.readUInt16LE,
    uint32: Buffer.prototype.readUInt32LE,
    'double': Buffer.prototype.readDoubleLE,
    'float': Buffer.prototype.readFloatLE,
  },
  BE: {
    int8: Buffer.prototype.readInt8,
    int16: Buffer.prototype.readInt16BE,
    int32: Buffer.prototype.readInt32BE,
    uint8: Buffer.prototype.readUInt8,
    uint16: Buffer.prototype.readUInt16BE,
    uint32: Buffer.prototype.readUInt32BE,
    'double': Buffer.prototype.readDoubleBE,
    'float': Buffer.prototype.readFloatBE,
  },
};

module.exports.createBinflow = function createBinflow(stru, endian = 'LE') {
  let _endian = endian;

  function struct() {
    //
  }

  function setEndian() {
    //
  }

  function parse(buf) {
    let offset = 0;
    let parsed = {};
    for (const key in stru) {
      const token = stru[key];
      const type = _getType(token);
      const endian = _hasEndian(token) ? token.slice(-2) : _endian;

      const reader = READERS[endian][type];
      const size = TOKEN_SIZE[type];
      parsed[key] = reader.call(buf, offset);
      offset += size;
    }

    console.log(parsed);
    return parsed;
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

  function _getType(token) {
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
    _getType,
  };
};

module.exports.TYPES = TYPES;
