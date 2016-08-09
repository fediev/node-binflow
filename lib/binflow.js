// no-endian-tailed types
const NE_TYPES = [
  'int8',
  'int16',
  'int24',
  'int32',
  'int48',
  'int64',
  'uint8',
  'uint16',
  'uint24',
  'uint32',
  'uint48',
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

/**
 * Create a binflow instance.
 *
 * There are 3 ways of setting endian.
 * 1. in-structure endian setting
 * 2. param-passed endian setting
 * 3. property level endian setting
 * The next one overrides the previous one.
 * When no endian setting, default endian is 'LE'.
 *
 * @param   {object} stru binflow structure
 * @param   {string} [endian] structure level endian. 'LE' or 'BE'
 * @returns {binflow} binflow instance
 * @example
 * const binflow = require('binflow');
 * const stru = {
 * 	 prop1: 'int8',
 * 	 prop2: 'uint16',
 * };
 * const bnf = binflow.createBinflow(stru);
 *
 * // 3 ways of setting endian
 * // in-structure endian setting
 * const stru = {
 * 	 $endian = 'BE',
 * 	 ...
 * };
 * // param-passed endian setting
 * const bnf = binflow.createBinflow(stru, 'LE');
 * // property level endian setting
 * const stru = {
 * 	 prop1: 'int8BE',
 * };
 */
function createBinflow(stru, endian) {
  let _this = {};
  let _struEndian;
  let _structure;
  let _consumedBufferSize = 0;

  struct(stru, endian);

  /**
   * Reset the binflow structure.
   *
   * @param   {object} newStru binflow structure
   * @param   {string} [newEndian] new structure endian
   * @returns {binflow} return _this for chaining
   */
  function struct(newStru, newEndian) {
    _validateStructure(newStru);
    _structure = newStru;
    // When no in-structure endian and no param endian,
    // current structure's endian will be preserved.
    const endianToSet = newEndian || (newStru && newStru.$endian)
                      || _struEndian || 'LE';
    setEndian(endianToSet);

    return _this;
  }

  /**
   * Reset the structure endian.
   * 'LE' : litte endian
   * 'BE' : big endian
   *
   * @param {string} newEndian new structure endian
   * @returns {binflow} return `_this` for chaining
   */
  function setEndian(newEndian) {
    if (newEndian === 'LE' || newEndian === 'BE') {
      _struEndian = newEndian;
    } else {
      throw new Error('WRONG_ENDIAN');
    }

    return _this;
  }

  /**
   * Get the structure endian.
   * @returns {string} structure endian
   */
  function getEndian() {
    return _struEndian;
  }

  /**
   * Parse buffer.
   *
   * @param   {buffer} buf buffer to parse
   * @param   {number} [startAt] parse starting point offset
   * @returns {object} parsed value
   * @example
   * const binflow = require('binflow');
   * const stru = {
   * 	prop1: 'int8',
   * 	prop2: 'uint16',
   * };
   * const bnf = binflow.createBinflow(stru);
   * const buf = Buffer.from('01020304', 'hex');
   * // { prop1: 0x01, prop2: 0x0302 }
   * const parsed = bnf.parse(buf);
   * // { prop1: 0x02, prop2: 0x0403 }
   * const parsed2 = bnf.parse(buf, 1);
   */
  function parse(buf, startAt) {
    let offset = startAt > 0 ? startAt : 0;
    const parsed = {};

    for (const key in _structure) {
      if (key === '$endian') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const token = _structure[key];
      try {
        const { value, size } = _parseByToken(buf, offset, token);
        parsed[key] = value;
        offset += size;
      } catch (e) {
        const len = buf.length;
        console.warn(
          `NOT_ENOUGH_BUFFER: ${key}(${token}) at ${offset}/${len}`
        );
        _consumedBufferSize = offset;
        return parsed;
      }
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
    const size = bnf._getConsumedBufferSize();

    return { value, size };
  }

  /**
   * Encode values to buffer.
   * When the value for the field is not supplied,
   * the buffer for the field will not change.
   *
   * @param   {object} values value object to encode
   * @param   {Buffer} [baseBuf] default buffer value
   * @returns {Buffer} encoded buffer
   * @example
   * const binflow = require('binflow');
   * const stru = {
   * 	prop1: 'int8',
   * 	prop2: 'uint16',
   * };
   * const bnf = binflow.createBinflow(stru);
   * const values = {
   * 	prop1: 0x01;
   * 	prop2: 0x0102;
   * };
   * // 0x010201
   * const encoded = bnf.encode(values);
   */
  function encode(values, baseBuf) {
    let offset = 0;
    const bufSize = _getStructureSize(_structure);
    const buf = Buffer.alloc(bufSize);
    if (Buffer.isBuffer(baseBuf)) {
      baseBuf.copy(buf);
    }

    for (const key in _structure) {
      if (key === '$endian') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const token = _structure[key];
      const value = values && values[key];
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
    const size = _getValueSize(type);
    _writeByType(value, buf, offset, type, _struEndian);

    return size;
  }

  function _encodeArrayToken(value, buf, offset, token) {
    const type = token[0];
    const count = token[1];
    const unitSize = _getValueSize(type);
    const size = unitSize * count;
    if (typeof value === 'undefined') {
      return size;
    }

    if (type === 'byte') {
      // value for byte type should be Buffer
      if (Buffer.isBuffer(value)) {
        value.copy(buf, offset);
      }
    } else if (type === 'string') {
      // value should be string. when `undefined`, `write` does nothing.
      buf.write(value, offset, 'utf8');
    } else if (typeof type === 'object') {
      const itemStru = type;
      const itemEndian = itemStru.$endian || _struEndian;
      const bnf = createBinflow(itemStru, itemEndian);

      for (let i = 0; i < count; i++) {
        const val = value[i];
        if (typeof val === 'undefined') {
          // eslint-disable-next-line no-continue
          continue;
        }
        const unitOffset = offset + (unitSize * i);
        const bufVal = bnf.encode(val, buf.slice(unitOffset));
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
    const propBuf = bnf.encode(value, buf.slice(offset));
    propBuf.copy(buf, offset);
    const size = bnf._getConsumedBufferSize();

    return size;
  }

  /**
   * Set value in buffer.
   * When the value for the field is not supplied,
   * the buffer for the field will not change.
   *
   * @param   {buffer} buf buffer to set value
   * @param   {string|object} field target field name or key value pairs
   * @param   {number|string} [subfield] array index or object propery name
   * @param   {*} value value to set
   * @returns {binflow} return _this for chaining
   * @example
   * const binflow = require('binflow');
   * const stru = {
   * 	 prop1: 'int8',
   * 	 prop2: ['int8', 2],
   * 	 prop3: {
   * 	   sub1: 'int16',
   * 	   sub2: 'int8',
   * 	 },
   * };
   * const bnf = binflow.createBinflow(stur);
   * bnf.set(buf, 'prop1', 0x01);
   * bnf.set(buf, 'prop2', [0x02, 0x03]);
   * bnf.set(buf, 'prop3', { sub1: 0x0405, sub2: 0x06 });
   * // set(buf, field, index, value)
   * bnf.set(buf, 'prop2', 1, 0x07);
   * // set(buf, field, property, value)
   * bnf.set(buf, 'prop3', 'sub2', 0x08);
   * // set(buf, values);
   * const values = {
   *   prop1: 0x01,
   *   prop2: [0x02],
   * };
   * bnf.set(buf, values);
   * // chainable
   * bnf.set(buf, 'prop1', 0x01)
   *    .set(buf, 'prop2', [0x02, 0x03])
   *    .set(buf, 'prop3', { sub1: 0x0405, sub2: 0x06 });
   */
  function set(buf, field, subfield, value) {
    if (typeof value === 'undefined') {
      // eslint-disable-next-line no-param-reassign
      value = subfield;
      // eslint-disable-next-line no-param-reassign, no-undefined
      subfield = undefined;
    }

    if (typeof field === 'object') {
      const values = field;
      Object.keys(values).forEach((key) => {
        const val = values[key];
        set(buf, key, val);
      });
    } else {
      try {
        const { token, offset } = _getTokenOffsetOfField(
          _structure, field, subfield
        );
        _encodeByToken(value, buf, offset, token);
      } catch (e) {
        // do nothing
      }
    }

    return _this;
  }

  /**
   * Get value from buffer.
   *
   * @param   {Buffer} buf buffer to get value from
   * @param   {string} field target field name
   * @param   {number|string} [subfield] array index or object propery name
   * @returns {*} return value from buffer
   * @example
   * const binflow = require('binflow');
   * const stru = {
   * 	 prop1: 'int8',
   * 	 prop2: ['int8', 2],
   * 	 prop3: {
   * 	   sub1: 'int16',
   * 	   sub2: 'int8',
   * 	 },
   * };
   * const bnf = binflow.createBinflow(stur);
   * bnf.get(buf, 'prop1');
   * bnf.get(buf, 'prop2');
   * bnf.get(buf, 'prop3');
   * // get(buf, field, index)
   * bnf.get(buf, 'prop2', 1);
   * // get(buf, field, property)
   * bnf.get(buf, 'prop3', 'sub2');
   */
  function get(buf, field, subfield) {
    const { token, offset } = _getTokenOffsetOfField(
      _structure, field, subfield
    );

    try {
      const { value } = _parseByToken(buf, offset, token);
      return value;
    } catch (e) {
      const len = buf.length;
      console.warn(
        `NOT_ENOUGH_BUFFER: ${field}(${token}) at ${offset}/${len}`
      );
      // eslint-disable-next-line consistent-return
      return;
    }
  }

  function _getConsumedBufferSize() {
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
    _getConsumedBufferSize,
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
  if (typeof value === 'undefined') {
    return 0;
  }

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
