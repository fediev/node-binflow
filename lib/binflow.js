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
  'byte': 1,
  string: 1,
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

const WRITERS = {
  LE: {
    int8: Buffer.prototype.writeInt8,
    int16: Buffer.prototype.writeInt16LE,
    int32: Buffer.prototype.writeInt32LE,
    uint8: Buffer.prototype.writeUInt8,
    uint16: Buffer.prototype.writeUInt16LE,
    uint32: Buffer.prototype.writeUInt32LE,
    'float': Buffer.prototype.writeFloatLE,
    'double': Buffer.prototype.writeDoubleLE,
  },
  BE: {
    int8: Buffer.prototype.writeInt8,
    int16: Buffer.prototype.writeInt16BE,
    int32: Buffer.prototype.writeInt32BE,
    uint8: Buffer.prototype.writeUInt8,
    uint16: Buffer.prototype.writeUInt16BE,
    uint32: Buffer.prototype.writeUInt32BE,
    'float': Buffer.prototype.writeFloatBE,
    'double': Buffer.prototype.writeDoubleBE,
  },
};

function createBinflow(stru, endian = 'LE') {
  let _endian;
  let _structure;
  let consumedBufferSize = 0;

  struct(stru, endian);

  function struct(newStru, newEndian = _endian) {
    _validateStructure(newStru);
    _structure = newStru;
    setEndian(newEndian);
  }

  function setEndian(newEndian) {
    if (newEndian === 'LE' || newEndian === 'BE') {
      _endian = newEndian;
    } else {
      throw new Error('WRONG_ENDIAN');
    }
  }

  function parse(buf) {
    let offset = 0;
    const parsed = {};

    for (const key in _structure) {
      const token = _structure[key];
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
    const value = _readByToken(buf, offset, token, _endian);
    const size = _getValueSize(token);

    return { value, size };
  }

  function _parseArrayToken(buf, offset, token) {
    const unitToken = token[0];
    const len = token[1];
    const unitSize = _getValueSize(unitToken);
    const size = unitSize * len;
    let value;
    if (unitToken === 'byte') {
      value = buf.slice(offset, offset + size);
    } else if (unitToken === 'string') {
      value = buf.slice(offset, offset + size).toString();
    } else {
      value = Array.from(new Array(len)).map((v, idx) => {
        const unitOffset = offset + (unitSize * idx);
        const val = _readByToken(buf, unitOffset, unitToken, _endian);
        return val;
      });
    }

    return { value, size };
  }

  function _parseObjectToken(buf, offset, token) {
    const bnf = createBinflow(token, _endian);
    const value = bnf.parse(buf.slice(offset));
    const size = bnf.getConsumedBufferSize();

    return { value, size };
  }

  function encode(value) {
    let offset = 0;
    const bufSize = _getStructureSize(_structure);
    const buf = Buffer.alloc(bufSize);

    for (const key in _structure) {
      const token = _structure[key];
      let size = 0;
      if (typeof token === 'string') {
        const val = value[key];
        _writeByToken(val, buf, offset, token, _endian);
        size = _getValueSize(token);
      } else if (Array.isArray(token)) {
        const unitToken = token[0];
        const len = token[1];
        const unitSize = _getValueSize(unitToken);
        size = unitSize * len;
        const vals = value[key];
        if (unitToken === 'byte') {
          // vals should be Buffer
          vals.copy(buf, offset);
        } else if (unitToken === 'string') {
          // vals should be string
          buf.write(vals, offset);
        } else {
          for (let i = 0; i < len; i++) {
            const val = vals[i];
            const unitOffset = offset + (unitSize * i);
            _writeByToken(val, buf, unitOffset, unitToken, _endian);
          }
        }
      } else if (typeof token === 'object') {
        const bnf = createBinflow(token, _endian);
        const val = value[key];
        const unitBuf = bnf.encode(val);
        unitBuf.copy(buf, offset);
        size = bnf.getConsumedBufferSize();
      }
      offset += size;
    }
    consumedBufferSize = offset;

    return buf;
  }

  function set() {
    // TODO: implement
  }

  function get() {
    // TODO: implement
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

// --------------------------------------------------------------------
// binflow static methods
// --------------------------------------------------------------------

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

function _writeByToken(val, buf, offset, token, endian = 'LE') {
  const type = _getType(token);
  const valueEndian = _hasEndian(token) ? token.slice(-2) : endian;
  const writer = WRITERS[valueEndian][type];
  return writer.call(buf, val, offset);
}

function _getValueSize(token) {
  const type = _getType(token);
  return VALUE_SIZE[type];
}

function _getTokenOffsetOfField(stru, field) {
  let offset = 0;

  for (const key in stru) {
    const token = stru[key];
    if (key === field) {
      return { token, offset };
    }

    if (typeof token === 'string') {
      const size = _getValueSize(token);
      offset += size;
    } else if (Array.isArray(token)) {
      const unitToken = token[0];
      const len = token[1];
      const unitSize = _getValueSize(unitToken);
      const size = unitSize * len;
      offset += size;
    } else if (typeof token === 'object') {
      const result = _getTokenOffsetOfField(token, field);
      if (result.token) {
        return {
          token: result.token,
          offset: offset + result.offset,
        };
      }
      offset += result.offset;
    }
  }

  return { offset };
}

function _getStructureSize(stru) {
  return _getTokenOffsetOfField(stru).offset;
}

module.exports = {
  TYPES,
  VALUE_SIZE,
  createBinflow,
  _hasEndian,
  _getType,
  _validateStructure,
  _readByToken,
  _writeByToken,
  _getValueSize,
  _getTokenOffsetOfField,
  _getStructureSize,
};
