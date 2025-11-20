'use strict';

function mask(source, mask, output, offset, length) {
  for (let i = 0; i < length; i += 1) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
}

function unmask(buffer, mask) {
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] ^= mask[i & 3];
  }
}

module.exports = {
  mask,
  unmask,
};
