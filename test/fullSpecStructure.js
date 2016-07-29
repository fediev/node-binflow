// total size: 59 bytes
const fullSpecStructure = {
  $endian: 'BE',
  prop1: 'int16',               // 2
  prop2: 'uint8',               // 1
  prop3: ['int16BE', 3],        // 6 = 2 * 3
  prop4: ['byte', 4],           // 4
  prop5: ['string', 5],         // 5
  // TODO: prop6: object array
  prop7: 'int32LE',             // 4
  prop8: {
    subprop1: 'uint32',         // 4
    subprop2: ['int16LE', 4],   // 8 = 2 * 4
    subprop3: ['byte', 2],      // 2
    subprop4: ['string', 5],    // 5
    // TODO: subprop5: object array
    subprop6: {
      subsubprop1: 'uint32BE',  // 4
      subsubprop2: ['int8', 4], // 4
    },
    subprop7: 'uint8',          // 1
  },
  prop9: {
    $endian: 'LE',
    sub2prop1: 'uint16',        // 2
    sub2prop2: 'uint32BE',      // 4
    sub2prop3: 'uint8',         // 1
  },
  prop10: 'uint16LE',            // 2
};

module.exports = fullSpecStructure;
