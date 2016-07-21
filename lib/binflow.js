const TYPES = [
  'int8',
  'int16',
  'int32',
  'uint8',
  'uint16',
  'uint32',
  'float',
  'double',
  'byte',
  'string',
];

const VALUE_SIZE = {
  int8: 1,
  int16: 2,
  int32: 4,
  uint8: 1,
  uint16: 2,
  uint32: 4,
  'float': 4,
  'double': 8,
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
    'float': Buffer.prototype.readFloatLE,
    'double': Buffer.prototype.readDoubleLE,
  },
  BE: {
    int8: Buffer.prototype.readInt8,
    int16: Buffer.prototype.readInt16BE,
    int32: Buffer.prototype.readInt32BE,
    uint8: Buffer.prototype.readUInt8,
    uint16: Buffer.prototype.readUInt16BE,
    uint32: Buffer.prototype.readUInt32BE,
    'float': Buffer.prototype.readFloatBE,
    'double': Buffer.prototype.readDoubleBE,
  },
};

function createBinflow(stru, endian = 'LE') {
  let baseEndian;
  let consumedBufferSize = 0;

  _validateStructure(stru);
  setEndian(endian);

  function struct() {
    //
  }

  function setEndian(newEndian) {
    if (newEndian === 'LE' || newEndian === 'BE') {
      baseEndian = newEndian;
    } else {
      throw new Error('WRONG_ENDIAN');
    }
  }

  function parse(buf) {
    let offset = 0;
    const parsed = {};

    for (const key in stru) {
      const token = stru[key];
      let result;
      if (typeof token === 'string') {
        result = _parseStringToken(buf, offset, token);
      } else if (Array.isArray(token)) {
        result = _parseArrayToken(buf, offset, token);
      } else if (typeof token === 'object') {
        result = _parseObjectToken(buf, offset, token);
      }
      parsed[key] = result.value;
      offset += result.size;
    }
    consumedBufferSize = offset;
    return parsed;
  }

  function _parseStringToken(buf, offset, token) {
    const value = _readByToken(buf, offset, token, baseEndian);
    const size = _getValueSize(token);

    return { value, size };
  }

  function _parseArrayToken(buf, offset, token) {
    const unitToken = token[0];
    const len = token[1];
    const unitSize = _getValueSize(unitToken);
    const size = unitSize * len;
    const value = Array.from(new Array(len)).map((v, idx) => {
      const unitOffset = offset + (unitSize * idx);
      const val = _readByToken(buf, unitOffset, unitToken, baseEndian);
      return val;
    });

    return { value, size };
  }

  function _parseObjectToken(buf, offset, token) {
    const bnf = createBinflow(token, baseEndian);
    const value = bnf.parse(buf.slice(offset));
    const size = bnf.getConsumedBufferSize();

    return { value, size };
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

  function getConsumedBufferSize() {
    return consumedBufferSize;
  }

  return {
    struct,
    setEndian,
    parse,
    encode,
    set,
    get,
    getConsumedBufferSize,
  };
}

function _hasEndian(token) {
  const tail = token.slice(-2);

  return tail === 'LE' || tail === 'BE';
}

function _getType(token) {
  return _hasEndian(token) ? token.slice(0, -2) : token;
}

function _validateStructure(stru) {
  for (const key in stru) {
    const token = stru[key];

    if (typeof token === 'string') {
      const type = _getType(token);
      if (type === 'string' || type === 'byte' || !TYPES.includes(type)) {
        throw new Error('WRONG_STRUCTURE');
      }
    } else if (Array.isArray(token)) {
      const type = _getType(token[0]);
      const count = token[1];
      if (!TYPES.includes(type) || typeof count !== 'number') {
        throw new Error('WRONG_STRUCTURE');
      }
    } else if (typeof token === 'object') {
      _validateStructure(token);
      // eslint-disable-next-line no-continue
      continue;
    } else {
      throw new Error('WRONG_STRUCTURE');
    }
  }
  return true;
}

function _readByToken(buf, offset, token, endian = 'LE') {
  const type = _getType(token);
  const valueEndian = _hasEndian(token) ? token.slice(-2) : endian;
  const reader = READERS[valueEndian][type];
  return reader.call(buf, offset);
}

function _getValueSize(token) {
  const type = _getType(token);
  return VALUE_SIZE[type];
}

module.exports = {
  TYPES,
  VALUE_SIZE,
  createBinflow,
  _hasEndian,
  _getType,
  _validateStructure,
  _readByToken,
  _getValueSize,
};
