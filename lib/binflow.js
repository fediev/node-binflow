// no-endian-tailed types
const NE_TYPES = [
  'int8',
  'int16',
  'int24',
  'int32',
  'int64',
  'uint8',
  'uint16',
  'uint24',
  'uint32',
  'uint64',
  'float',
  'double',
  'byte',
  'string',
];

const READERS = {
  LE: {
    'int': Buffer.prototype.readIntLE,
    uint: Buffer.prototype.readUIntLE,
    'float': Buffer.prototype.readFloatLE,
    'double': Buffer.prototype.readDoubleLE,
  },
  BE: {
    'int': Buffer.prototype.readIntBE,
    uint: Buffer.prototype.readUIntBE,
    'float': Buffer.prototype.readFloatBE,
    'double': Buffer.prototype.readDoubleBE,
  },
};

const WRITERS = {
  LE: {
    'int': Buffer.prototype.writeIntLE,
    uint: Buffer.prototype.writeUIntLE,
    'float': Buffer.prototype.writeFloatLE,
    'double': Buffer.prototype.writeDoubleLE,
  },
  BE: {
    'int': Buffer.prototype.writeIntBE,
    uint: Buffer.prototype.writeUIntBE,
    'float': Buffer.prototype.writeFloatBE,
    'double': Buffer.prototype.writeDoubleBE,
  },
};

function createBinflow(stru, endian) {
  let _this = {};
  let _struEndian;
  let _structure;
  let _consumedBufferSize = 0;

  struct(stru, endian);

  /**
   * Reset binflow structure.
   * When no in-structure endian and no param endian,
   * current structure's endian will be preserved.
   *
   * @param   {object} newStru binflow structure
   * @param   {string} [newEndian] new structure endian
   * @returns {binflow} return _this for chaining
   */
  function struct(newStru, newEndian) {
    _validateStructure(newStru);
    _structure = newStru;
    const endianToSet = newEndian || (newStru && newStru.$endian)
                      || _struEndian || 'LE';
    setEndian(endianToSet);

    return _this;
  }

  function setEndian(newEndian) {
    if (newEndian === 'LE' || newEndian === 'BE') {
      _struEndian = newEndian;
    } else {
      throw new Error('WRONG_ENDIAN');
    }

    return _this;
  }

  function getEndian() {
    return _struEndian;
  }

  function parse(buf, startAt) {
    let offset = startAt > 0 ? startAt : 0;
    const parsed = {};

    for (const key in _structure) {
      if (key === '$endian') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const token = _structure[key];
      const { value, size } = _parseByToken(buf, offset, token);
      parsed[key] = value;
      offset += size;
    }
    _consumedBufferSize = offset;

    return parsed;
  }

  function _parseByToken(buf, offset, token) {
    let result = {};
    if (typeof token === 'string') {
      result = _parseStringToken(buf, offset, token);
    } else if (Array.isArray(token)) {
      result = _parseArrayToken(buf, offset, token);
    } else if (typeof token === 'object') {
      result = _parseObjectToken(buf, offset, token);
    }

    return result;
  }

  function _parseStringToken(buf, offset, token) {
    const type = token;
    const value = _readByType(buf, offset, type, _struEndian);
    const size = _getValueSize(type);

    return { value, size };
  }

  function _parseArrayToken(buf, offset, token) {
    const type = token[0];
    const count = token[1];
    const unitSize = _getValueSize(type);
    const size = unitSize * count;

    let value;
    if (type === 'byte') {
      value = buf.slice(offset, offset + size);
    } else if (type === 'string') {
      value = buf.slice(offset, offset + size).toString();
    } else if (typeof type === 'object') {
      const itemStru = type;
      const itemEndian = itemStru.$endian || _struEndian;
      const bnf = createBinflow(itemStru, itemEndian);

      value = Array.from(new Array(count)).map((v, idx) => {
        const unitOffset = offset + (unitSize * idx);
        const val = bnf.parse(buf, unitOffset);
        return val;
      });
    } else {
      value = Array.from(new Array(count)).map((v, idx) => {
        const unitOffset = offset + (unitSize * idx);
        const val = _readByType(buf, unitOffset, type, _struEndian);
        return val;
      });
    }

    return { value, size };
  }

  function _parseObjectToken(buf, offset, token) {
    const propStru = token;
    const propEndian = propStru.$endian || _struEndian;
    const bnf = createBinflow(propStru, propEndian);
    const value = bnf.parse(buf.slice(offset));
    const size = bnf.getConsumedBufferSize();

    return { value, size };
  }

  function encode(values) {
    let offset = 0;
    const bufSize = _getStructureSize(_structure);
    const buf = Buffer.alloc(bufSize);

    for (const key in _structure) {
      if (key === '$endian') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const token = _structure[key];
      const value = values[key];
      const size = _encodeByToken(value, buf, offset, token);
      offset += size;
    }
    _consumedBufferSize = offset;

    return buf;
  }

  function _encodeByToken(value, buf, offset, token) {
    let size = 0;
    if (typeof token === 'string') {
      size = _encodeStringToken(value, buf, offset, token);
    } else if (Array.isArray(token)) {
      size = _encodeArrayToken(value, buf, offset, token);
    } else if (typeof token === 'object') {
      size = _encodeObjectToken(value, buf, offset, token);
    }

    return size;
  }

  function _encodeStringToken(value, buf, offset, token) {
    const type = token;
    _writeByType(value, buf, offset, type, _struEndian);
    const size = _getValueSize(type);

    return size;
  }

  function _encodeArrayToken(value, buf, offset, token) {
    const type = token[0];
    const count = token[1];
    const unitSize = _getValueSize(type);
    const size = unitSize * count;

    if (type === 'byte') {
      // value should be Buffer
      value.copy(buf, offset);
    } else if (type === 'string') {
      // value should be string
      buf.write(value, offset, 'utf8');
    } else if (typeof type === 'object') {
      const itemStru = type;
      const itemEndian = itemStru.$endian || _struEndian;
      const bnf = createBinflow(itemStru, itemEndian);

      for (let i = 0; i < count; i++) {
        const val = value[i];
        const unitOffset = offset + (unitSize * i);
        const bufVal = bnf.encode(val);
        bufVal.copy(buf, unitOffset);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const val = value[i];
        const unitOffset = offset + (unitSize * i);
        _writeByType(val, buf, unitOffset, type, _struEndian);
      }
    }

    return size;
  }

  function _encodeObjectToken(value, buf, offset, token) {
    const propStru = token;
    const propEndian = propStru.$endian || _struEndian;
    const bnf = createBinflow(propStru, propEndian);
    const propBuf = bnf.encode(value);
    propBuf.copy(buf, offset);
    const size = bnf.getConsumedBufferSize();
    return size;
  }

  function set(buf, field, value) {
    const { token, offset } = _getTokenOffsetOfField(_structure, field);
    _encodeByToken(value, buf, offset, token);

    return _this;
  }

  function get(buf, field) {
    const { token, offset } = _getTokenOffsetOfField(_structure, field);
    const { value } = _parseByToken(buf, offset, token);
    return value;
  }

  function getConsumedBufferSize() {
    return _consumedBufferSize;
  }

  _this = {
    struct,
    setEndian,
    getEndian,
    parse,
    encode,
    set,
    get,
    getConsumedBufferSize,
  };

  return _this;
}

// --------------------------------------------------------------------
// binflow static methods
// --------------------------------------------------------------------

function _hasEndian(type) {
  const tail = type.slice(-2);

  return tail === 'LE' || tail === 'BE';
}

// type = ntype + endian. ex) 'int32LE' = 'int32' + 'LE'
// ntype = ptype + nbits. ex) 'int32' = 'int' + '32'
function _getNeType(type) {
  return _hasEndian(type) ? type.slice(0, -2) : type;
}

function _getPrimaryType(type) {
  if (_isIntType(type)) {
    return 'int';
  } else if (_isUIntType(type)) {
    return 'uint';
  } else {
    return _getNeType(type);
  }
}

function _validateStructure(stru) {
  for (const key in stru) {
    if (key === '$endian') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const token = stru[key];
    if (typeof token === 'string') {
      const type = token;
      const ntype = _getNeType(type);
      if (ntype === 'string' || ntype === 'byte' || !NE_TYPES.includes(ntype)) {
        console.error('WRONG_STRUCTURE:', key, token, ntype);
        throw new Error('WRONG_STRUCTURE');
      }
    } else if (Array.isArray(token)) {
      const type = token[0];
      const count = token[1];
      if (typeof type === 'object') {
        const itemStru = type;
        _validateStructure(itemStru);
      } else {
        const ntype = _getNeType(type);
        if (!NE_TYPES.includes(ntype) || typeof count !== 'number') {
          console.error('WRONG_STRUCTURE:', key, token, ntype, count);
          throw new Error('WRONG_STRUCTURE');
        }
      }
    } else if (typeof token === 'object') {
      const propStru = token;
      _validateStructure(propStru);
    } else {
      console.error('WRONG_STRUCTURE:', key, token);
      throw new Error('WRONG_STRUCTURE');
    }
  }

  return true;
}

function _readByType(buf, offset, type, endian = 'LE') {
  const ptype = _getPrimaryType(type);
  // when float and double, size will be `false` for `noAssert`
  const size = _isIntUIntType(type) ? _getValueSize(type) : false;
  const valueEndian = _hasEndian(type) ? type.slice(-2) : endian;
  const reader = READERS[valueEndian][ptype];

  if (size > 6) {
    console.warn('read[U]Int[LE,BE] support up to 48 bits of accuracy');
  }
  return reader.call(buf, offset, size);
}

function _writeByType(value, buf, offset, type, endian = 'LE') {
  const ptype = _getPrimaryType(type);
  // when float and double, size will be `false` for `noAssert`
  const size = _isIntUIntType(type) ? _getValueSize(type) : false;
  const valueEndian = _hasEndian(type) ? type.slice(-2) : endian;
  const writer = WRITERS[valueEndian][ptype];
  return writer.call(buf, value, offset, size);
}

function _getValueSize(type) {
  if (typeof type === 'object') {
    return _getStructureSize(type);
  }

  const ntype = _getNeType(type);
  if (_isIntUIntType(type)) {
    const start = _isIntType(type) ? 3 : 4;
    const nbits = parseInt(ntype.slice(start));

    return Math.floor(nbits / 8);
  } else {
    const sizes = {
      'float': 4,
      'double': 8,
      'byte': 1,
      string: 1,
    };

    return sizes[ntype] || 0;
  }
}

// field in object array token is not supported
function _getTokenOffsetOfField(stru, field, subfield) {
  let offset = 0;

  for (const key in stru) {
    // not needed because _getValueSize('$endian') returns 0
    // but process explicitly
    if (key === '$endian') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const token = stru[key];
    if (key === field) {
      if (subfield && Array.isArray(token)) {
        return _getTokenOffsetOfArrayItem(key, token, offset, subfield);
      } else if (subfield && typeof token === 'object') {
        return _getTokenOffsetOfObjectChild(key, token, offset, subfield);
      }

      return { token, offset };
    }

    if (typeof token === 'string') {
      const type = token;
      const size = _getValueSize(type);
      offset += size;
    } else if (Array.isArray(token)) {
      const type = token[0];
      const count = token[1];
      const unitSize = _getValueSize(type);
      const size = unitSize * count;
      offset += size;
    } else if (typeof token === 'object') {
      const propStru = token;
      const result = _getTokenOffsetOfField(propStru, field);
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

function _getTokenOffsetOfArrayItem(key, token, offset, index) {
  const itemToken = token[0];
  const count = token[1];
  if (index >= count) {
    throw new RangeError(`${key}: ${index} >= ${count}`);
  }
  const itemSize = _getValueSize(itemToken);
  // eslint-disable-next-line no-mixed-operators
  const itemOffset = offset + index * itemSize;

  return { token: itemToken, offset: itemOffset };
}

function _getTokenOffsetOfObjectChild(key, token, offset, child) {
  const field = child;
  const result = _getTokenOffsetOfField(token, field);

  if (typeof result.token === 'undefined') {
    throw new RangeError(`${key}: '${child}' does not exist`);
  }

  return { token: result.token, offset: offset + result.offset };
}

function _getStructureSize(stru) {
  return _getTokenOffsetOfField(stru).offset;
}

function _isIntUIntType(type) {
  return _isIntType(type) || _isUIntType(type);
}

function _isIntType(type) {
  return type.indexOf('int') === 0;
}

function _isUIntType(type) {
  return type.indexOf('uint') === 0;
}

module.exports = {
  NE_TYPES,
  createBinflow,
  _hasEndian,
  _getNeType,
  _getPrimaryType,
  _validateStructure,
  _readByType,
  _writeByType,
  _getValueSize,
  _getTokenOffsetOfField,
  _getStructureSize,
};
