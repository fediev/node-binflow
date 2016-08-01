# node-binflow

nodejs buffer parser and encoder

# How to Install

```
npm install binflow
```

# How to Use

## Basic

```js
const binflow = require('binflow');
const stru = {
  prop1: 'int8',
  prop2: 'uint16',
};
const bnf = binflow.createBinflow(stru);
// and use binflow instance `bnf`
```

## Structure

```
structure =
  $endian: 'LE' | 'BE'
  (prop-name : token) * N
```

```js
const stru = {
  $endian: 'BE',
  prop1: 'int8',
  prop2: ['int16', 4],
  prop3: {
    sub1: 'uint8',
    sub2: 'uint16',
  }
  ...
}
```

### Supported tokens

- string tokens

  `int8`, `int16`, `int24`, `int32`, `int48`,  `uint8`, `uint16`,
  `uint24`, `uint32`, `uint48`, `float`, `double`
  and its endian-tailed formats (ex: `int8LE`)

- array token : `['type', count]`

  1. array of string token
  ```js
  const stru = {
    prop1: ['int32LE', 7],
  };
  ```
  2. byte stream
  ```js
  const stru = {
    prop1: ['byte', 14],
  };
  ```
  3. string : `count` is not the length of string value,
  but the length of buffer.
  ```js
  const stru = {
    prop1: ['string', 8],
  };
  ```

- object token

```js
const stru = {
  prop1: {
    sub1: 'int8',
    sub2: 'int32',
    ...
  },
};
```

## Endian

There are 3 ways of setting endian.

1. in-structure endian setting
```js
const stru = {
  $endian: 'LE',
  prop1: 'int8',
  ...
};
```
2. param-passed endian setting
```js
binflow.createBinflow(stru, 'LE');
binflow.struct(stru, 'BE');
```
3. property level endian setting
```js
const stru = {
  prop1: 'int32LE',
  prop2: 'floatBE',
  ...
};
```

The next one overrides the previous one.

When binflow is created without in-structure endian and endian param,
default endian is 'LE'. When binflow's structure is reset
without in-structure endian and endian param, current structure endian is
preserved.


# API

## `parse(buf[, startAt])`

Parse buffer.

```js
const binflow = require('binflow');
const stru = {
  prop1: 'int8',
  prop2: 'uint16',
};
const bnf = binflow.createBinflow(stru);
const buf = Buffer.from('01020304', 'hex');
// { prop1: 0x01, prop2: 0x0302 }
const parsed = bnf.parse(buf);
// { prop1: 0x02, prop2: 0x0403 }
const parsed2 = bnf.parse(buf, 1);
```

## `encode(values)`

Encode values as buffer.

```js
const binflow = require('binflow');
const stru = {
  prop1: 'int8',
  prop2: 'uint16',
};
const bnf = binflow.createBinflow(stru);
const values = {
  prop1: 0x01;
  prop2: 0x0102;
};
// 0x010201
const encoded = bnf.encode(values);
```

## `set(buf, field, [subfield,] value)`

Set value in buffer.

```js
const binflow = require('binflow');
const stru = {
   prop1: 'int8',
   prop2: ['int8', 2],
   prop3: {
     sub1: 'int16',
     sub2: 'int8',
   },
};
const bnf = binflow.createBinflow(stur);
bnf.set(buf, 'prop1', 0x01);
bnf.set(buf, 'prop2', [0x02, 0x03]);
bnf.set(buf, 'prop3', { sub1: 0x0405, sub2: 0x06 });
bnf.set(buf, 'prop2', 1, 0x07);
bnf.set(buf, 'prop3', 'sub2', 0x08);
// chainable
bnf.set(buf, 'prop1', 0x01)
   .set(buf, 'prop2', [0x02, 0x03])
   .set(buf, 'prop3', { sub1: 0x0405, sub2: 0x06 });
```

## `get(buf, field[, subfield])`

Get value from buffer.

```js
const binflow = require('binflow');
const stru = {
   prop1: 'int8',
   prop2: ['int8', 2],
   prop3: {
     sub1: 'int16',
     sub2: 'int8',
   },
};
const bnf = binflow.createBinflow(stur);
bnf.get(buf, 'prop1');
bnf.get(buf, 'prop2');
bnf.get(buf, 'prop3');
bnf.get(buf, 'prop2', 1);
bnf.get(buf, 'prop3', 'sub2');
```
