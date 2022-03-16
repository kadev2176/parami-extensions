(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@polkadot/util')) :
  typeof define === 'function' && define.amd ? define(['exports', '@polkadot/util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.polkadotUtilCrypto = {}, global.polkadotUtil));
})(this, (function (exports, util) { 'use strict';

  const global = window;

  function evaluateThis(fn) {
    return fn('return this');
  }
  const xglobal = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : evaluateThis(Function);
  function exposeGlobal(name, fallback) {
    if (typeof xglobal[name] === 'undefined') {
      xglobal[name] = fallback;
    }
  }

  const BigInt$1 = typeof xglobal.BigInt === 'function' && typeof xglobal.BigInt.asIntN === 'function' ? xglobal.BigInt : () => Number.NaN;

  exposeGlobal('BigInt', BigInt$1);

  const nodeCrypto = {};

  const crypto$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': nodeCrypto
  });

  /*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */
  const _0n$1 = BigInt(0);
  const _1n$1 = BigInt(1);
  const _2n$1 = BigInt(2);
  const _3n = BigInt(3);
  const _8n = BigInt(8);
  const POW_2_256 = _2n$1 ** BigInt(256);
  const CURVE = {
      a: _0n$1,
      b: BigInt(7),
      P: POW_2_256 - _2n$1 ** BigInt(32) - BigInt(977),
      n: POW_2_256 - BigInt('432420386565659656852420866394968145599'),
      h: _1n$1,
      Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
      Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
      beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
  };
  function weistrass(x) {
      const { a, b } = CURVE;
      const x2 = mod(x * x);
      const x3 = mod(x2 * x);
      return mod(x3 + a * x + b);
  }
  const USE_ENDOMORPHISM = CURVE.a === _0n$1;
  class JacobianPoint {
      constructor(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
      }
      static fromAffine(p) {
          if (!(p instanceof Point)) {
              throw new TypeError('JacobianPoint#fromAffine: expected Point');
          }
          return new JacobianPoint(p.x, p.y, _1n$1);
      }
      static toAffineBatch(points) {
          const toInv = invertBatch(points.map((p) => p.z));
          return points.map((p, i) => p.toAffine(toInv[i]));
      }
      static normalizeZ(points) {
          return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
      }
      equals(other) {
          if (!(other instanceof JacobianPoint))
              throw new TypeError('JacobianPoint expected');
          const { x: X1, y: Y1, z: Z1 } = this;
          const { x: X2, y: Y2, z: Z2 } = other;
          const Z1Z1 = mod(Z1 ** _2n$1);
          const Z2Z2 = mod(Z2 ** _2n$1);
          const U1 = mod(X1 * Z2Z2);
          const U2 = mod(X2 * Z1Z1);
          const S1 = mod(mod(Y1 * Z2) * Z2Z2);
          const S2 = mod(mod(Y2 * Z1) * Z1Z1);
          return U1 === U2 && S1 === S2;
      }
      negate() {
          return new JacobianPoint(this.x, mod(-this.y), this.z);
      }
      double() {
          const { x: X1, y: Y1, z: Z1 } = this;
          const A = mod(X1 ** _2n$1);
          const B = mod(Y1 ** _2n$1);
          const C = mod(B ** _2n$1);
          const D = mod(_2n$1 * (mod((X1 + B) ** _2n$1) - A - C));
          const E = mod(_3n * A);
          const F = mod(E ** _2n$1);
          const X3 = mod(F - _2n$1 * D);
          const Y3 = mod(E * (D - X3) - _8n * C);
          const Z3 = mod(_2n$1 * Y1 * Z1);
          return new JacobianPoint(X3, Y3, Z3);
      }
      add(other) {
          if (!(other instanceof JacobianPoint))
              throw new TypeError('JacobianPoint expected');
          const { x: X1, y: Y1, z: Z1 } = this;
          const { x: X2, y: Y2, z: Z2 } = other;
          if (X2 === _0n$1 || Y2 === _0n$1)
              return this;
          if (X1 === _0n$1 || Y1 === _0n$1)
              return other;
          const Z1Z1 = mod(Z1 ** _2n$1);
          const Z2Z2 = mod(Z2 ** _2n$1);
          const U1 = mod(X1 * Z2Z2);
          const U2 = mod(X2 * Z1Z1);
          const S1 = mod(mod(Y1 * Z2) * Z2Z2);
          const S2 = mod(mod(Y2 * Z1) * Z1Z1);
          const H = mod(U2 - U1);
          const r = mod(S2 - S1);
          if (H === _0n$1) {
              if (r === _0n$1) {
                  return this.double();
              }
              else {
                  return JacobianPoint.ZERO;
              }
          }
          const HH = mod(H ** _2n$1);
          const HHH = mod(H * HH);
          const V = mod(U1 * HH);
          const X3 = mod(r ** _2n$1 - HHH - _2n$1 * V);
          const Y3 = mod(r * (V - X3) - S1 * HHH);
          const Z3 = mod(Z1 * Z2 * H);
          return new JacobianPoint(X3, Y3, Z3);
      }
      subtract(other) {
          return this.add(other.negate());
      }
      multiplyUnsafe(scalar) {
          let n = normalizeScalar(scalar);
          const P0 = JacobianPoint.ZERO;
          if (n === _0n$1)
              return P0;
          if (n === _1n$1)
              return this;
          if (!USE_ENDOMORPHISM) {
              let p = P0;
              let d = this;
              while (n > _0n$1) {
                  if (n & _1n$1)
                      p = p.add(d);
                  d = d.double();
                  n >>= _1n$1;
              }
              return p;
          }
          let { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
          let k1p = P0;
          let k2p = P0;
          let d = this;
          while (k1 > _0n$1 || k2 > _0n$1) {
              if (k1 & _1n$1)
                  k1p = k1p.add(d);
              if (k2 & _1n$1)
                  k2p = k2p.add(d);
              d = d.double();
              k1 >>= _1n$1;
              k2 >>= _1n$1;
          }
          if (k1neg)
              k1p = k1p.negate();
          if (k2neg)
              k2p = k2p.negate();
          k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
          return k1p.add(k2p);
      }
      precomputeWindow(W) {
          const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
          const points = [];
          let p = this;
          let base = p;
          for (let window = 0; window < windows; window++) {
              base = p;
              points.push(base);
              for (let i = 1; i < 2 ** (W - 1); i++) {
                  base = base.add(p);
                  points.push(base);
              }
              p = base.double();
          }
          return points;
      }
      wNAF(n, affinePoint) {
          if (!affinePoint && this.equals(JacobianPoint.BASE))
              affinePoint = Point.BASE;
          const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
          if (256 % W) {
              throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
          }
          let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
          if (!precomputes) {
              precomputes = this.precomputeWindow(W);
              if (affinePoint && W !== 1) {
                  precomputes = JacobianPoint.normalizeZ(precomputes);
                  pointPrecomputes.set(affinePoint, precomputes);
              }
          }
          let p = JacobianPoint.ZERO;
          let f = JacobianPoint.ZERO;
          const windows = 1 + (USE_ENDOMORPHISM ? 128 / W : 256 / W);
          const windowSize = 2 ** (W - 1);
          const mask = BigInt(2 ** W - 1);
          const maxNumber = 2 ** W;
          const shiftBy = BigInt(W);
          for (let window = 0; window < windows; window++) {
              const offset = window * windowSize;
              let wbits = Number(n & mask);
              n >>= shiftBy;
              if (wbits > windowSize) {
                  wbits -= maxNumber;
                  n += _1n$1;
              }
              if (wbits === 0) {
                  let pr = precomputes[offset];
                  if (window % 2)
                      pr = pr.negate();
                  f = f.add(pr);
              }
              else {
                  let cached = precomputes[offset + Math.abs(wbits) - 1];
                  if (wbits < 0)
                      cached = cached.negate();
                  p = p.add(cached);
              }
          }
          return { p, f };
      }
      multiply(scalar, affinePoint) {
          let n = normalizeScalar(scalar);
          let point;
          let fake;
          if (USE_ENDOMORPHISM) {
              const { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
              let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
              let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
              if (k1neg)
                  k1p = k1p.negate();
              if (k2neg)
                  k2p = k2p.negate();
              k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
              point = k1p.add(k2p);
              fake = f1p.add(f2p);
          }
          else {
              const { p, f } = this.wNAF(n, affinePoint);
              point = p;
              fake = f;
          }
          return JacobianPoint.normalizeZ([point, fake])[0];
      }
      toAffine(invZ = invert(this.z)) {
          const { x, y, z } = this;
          const iz1 = invZ;
          const iz2 = mod(iz1 * iz1);
          const iz3 = mod(iz2 * iz1);
          const ax = mod(x * iz2);
          const ay = mod(y * iz3);
          const zz = mod(z * iz1);
          if (zz !== _1n$1)
              throw new Error('invZ was invalid');
          return new Point(ax, ay);
      }
  }
  JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n$1);
  JacobianPoint.ZERO = new JacobianPoint(_0n$1, _1n$1, _0n$1);
  const pointPrecomputes = new WeakMap();
  class Point {
      constructor(x, y) {
          this.x = x;
          this.y = y;
      }
      _setWindowSize(windowSize) {
          this._WINDOW_SIZE = windowSize;
          pointPrecomputes.delete(this);
      }
      static fromCompressedHex(bytes) {
          const isShort = bytes.length === 32;
          const x = bytesToNumber(isShort ? bytes : bytes.subarray(1));
          if (!isValidFieldElement(x))
              throw new Error('Point is not on curve');
          const y2 = weistrass(x);
          let y = sqrtMod(y2);
          const isYOdd = (y & _1n$1) === _1n$1;
          if (isShort) {
              if (isYOdd)
                  y = mod(-y);
          }
          else {
              const isFirstByteOdd = (bytes[0] & 1) === 1;
              if (isFirstByteOdd !== isYOdd)
                  y = mod(-y);
          }
          const point = new Point(x, y);
          point.assertValidity();
          return point;
      }
      static fromUncompressedHex(bytes) {
          const x = bytesToNumber(bytes.subarray(1, 33));
          const y = bytesToNumber(bytes.subarray(33, 65));
          const point = new Point(x, y);
          point.assertValidity();
          return point;
      }
      static fromHex(hex) {
          const bytes = ensureBytes(hex);
          const len = bytes.length;
          const header = bytes[0];
          if (len === 32 || (len === 33 && (header === 0x02 || header === 0x03))) {
              return this.fromCompressedHex(bytes);
          }
          if (len === 65 && header === 0x04)
              return this.fromUncompressedHex(bytes);
          throw new Error(`Point.fromHex: received invalid point. Expected 32-33 compressed bytes or 65 uncompressed bytes, not ${len}`);
      }
      static fromPrivateKey(privateKey) {
          return Point.BASE.multiply(normalizePrivateKey(privateKey));
      }
      static fromSignature(msgHash, signature, recovery) {
          msgHash = ensureBytes(msgHash);
          const h = truncateHash(msgHash);
          const { r, s } = normalizeSignature(signature);
          if (recovery !== 0 && recovery !== 1) {
              throw new Error('Cannot recover signature: invalid recovery bit');
          }
          if (h === _0n$1)
              throw new Error('Cannot recover signature: msgHash cannot be 0');
          const prefix = recovery & 1 ? '03' : '02';
          const R = Point.fromHex(prefix + numTo32bStr(r));
          const { n } = CURVE;
          const rinv = invert(r, n);
          const u1 = mod(-h * rinv, n);
          const u2 = mod(s * rinv, n);
          const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
          if (!Q)
              throw new Error('Cannot recover signature: point at infinify');
          Q.assertValidity();
          return Q;
      }
      toRawBytes(isCompressed = false) {
          return hexToBytes(this.toHex(isCompressed));
      }
      toHex(isCompressed = false) {
          const x = numTo32bStr(this.x);
          if (isCompressed) {
              const prefix = this.y & _1n$1 ? '03' : '02';
              return `${prefix}${x}`;
          }
          else {
              return `04${x}${numTo32bStr(this.y)}`;
          }
      }
      toHexX() {
          return this.toHex(true).slice(2);
      }
      toRawX() {
          return this.toRawBytes(true).slice(1);
      }
      assertValidity() {
          const msg = 'Point is not on elliptic curve';
          const { x, y } = this;
          if (!isValidFieldElement(x) || !isValidFieldElement(y))
              throw new Error(msg);
          const left = mod(y * y);
          const right = weistrass(x);
          if (mod(left - right) !== _0n$1)
              throw new Error(msg);
      }
      equals(other) {
          return this.x === other.x && this.y === other.y;
      }
      negate() {
          return new Point(this.x, mod(-this.y));
      }
      double() {
          return JacobianPoint.fromAffine(this).double().toAffine();
      }
      add(other) {
          return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
      }
      subtract(other) {
          return this.add(other.negate());
      }
      multiply(scalar) {
          return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
      }
      multiplyAndAddUnsafe(Q, a, b) {
          const P = JacobianPoint.fromAffine(this);
          const aP = P.multiply(a);
          const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b);
          const sum = aP.add(bQ);
          return sum.equals(JacobianPoint.ZERO) ? undefined : sum.toAffine();
      }
  }
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
  Point.ZERO = new Point(_0n$1, _0n$1);
  function sliceDER(s) {
      return Number.parseInt(s[0], 16) >= 8 ? '00' + s : s;
  }
  function parseDERInt(data) {
      if (data.length < 2 || data[0] !== 0x02) {
          throw new Error(`Invalid signature integer tag: ${bytesToHex(data)}`);
      }
      const len = data[1];
      const res = data.subarray(2, len + 2);
      if (!len || res.length !== len) {
          throw new Error(`Invalid signature integer: wrong length`);
      }
      if (res[0] === 0x00 && res[1] <= 0x7f) {
          throw new Error('Invalid signature integer: trailing length');
      }
      return { data: bytesToNumber(res), left: data.subarray(len + 2) };
  }
  function parseDERSignature(data) {
      if (data.length < 2 || data[0] != 0x30) {
          throw new Error(`Invalid signature tag: ${bytesToHex(data)}`);
      }
      if (data[1] !== data.length - 2) {
          throw new Error('Invalid signature: incorrect length');
      }
      const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
      const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
      if (rBytesLeft.length) {
          throw new Error(`Invalid signature: left bytes after parsing: ${bytesToHex(rBytesLeft)}`);
      }
      return { r, s };
  }
  class Signature {
      constructor(r, s) {
          this.r = r;
          this.s = s;
          this.assertValidity();
      }
      static fromCompact(hex) {
          const arr = isUint8a(hex);
          const name = 'Signature.fromCompact';
          if (typeof hex !== 'string' && !arr)
              throw new TypeError(`${name}: Expected string or Uint8Array`);
          const str = arr ? bytesToHex(hex) : hex;
          if (str.length !== 128)
              throw new Error(`${name}: Expected 64-byte hex`);
          return new Signature(hexToNumber(str.slice(0, 64)), hexToNumber(str.slice(64, 128)));
      }
      static fromDER(hex) {
          const arr = isUint8a(hex);
          if (typeof hex !== 'string' && !arr)
              throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`);
          const { r, s } = parseDERSignature(arr ? hex : hexToBytes(hex));
          return new Signature(r, s);
      }
      static fromHex(hex) {
          return this.fromDER(hex);
      }
      assertValidity() {
          const { r, s } = this;
          if (!isWithinCurveOrder(r))
              throw new Error('Invalid Signature: r must be 0 < r < n');
          if (!isWithinCurveOrder(s))
              throw new Error('Invalid Signature: s must be 0 < s < n');
      }
      hasHighS() {
          const HALF = CURVE.n >> _1n$1;
          return this.s > HALF;
      }
      normalizeS() {
          return this.hasHighS() ? new Signature(this.r, CURVE.n - this.s) : this;
      }
      toDERRawBytes(isCompressed = false) {
          return hexToBytes(this.toDERHex(isCompressed));
      }
      toDERHex(isCompressed = false) {
          const sHex = sliceDER(numberToHexUnpadded(this.s));
          if (isCompressed)
              return sHex;
          const rHex = sliceDER(numberToHexUnpadded(this.r));
          const rLen = numberToHexUnpadded(rHex.length / 2);
          const sLen = numberToHexUnpadded(sHex.length / 2);
          const length = numberToHexUnpadded(rHex.length / 2 + sHex.length / 2 + 4);
          return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
      }
      toRawBytes() {
          return this.toDERRawBytes();
      }
      toHex() {
          return this.toDERHex();
      }
      toCompactRawBytes() {
          return hexToBytes(this.toCompactHex());
      }
      toCompactHex() {
          return numTo32bStr(this.r) + numTo32bStr(this.s);
      }
  }
  function concatBytes(...arrays) {
      if (!arrays.every(isUint8a))
          throw new Error('Uint8Array list expected');
      if (arrays.length === 1)
          return arrays[0];
      const length = arrays.reduce((a, arr) => a + arr.length, 0);
      const result = new Uint8Array(length);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
          const arr = arrays[i];
          result.set(arr, pad);
          pad += arr.length;
      }
      return result;
  }
  function isUint8a(bytes) {
      return bytes instanceof Uint8Array;
  }
  const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
  function bytesToHex(uint8a) {
      if (!(uint8a instanceof Uint8Array))
          throw new Error('Expected Uint8Array');
      let hex = '';
      for (let i = 0; i < uint8a.length; i++) {
          hex += hexes[uint8a[i]];
      }
      return hex;
  }
  function numTo32bStr(num) {
      if (num > POW_2_256)
          throw new Error('Expected number < 2^256');
      return num.toString(16).padStart(64, '0');
  }
  function numTo32b(num) {
      return hexToBytes(numTo32bStr(num));
  }
  function numberToHexUnpadded(num) {
      const hex = num.toString(16);
      return hex.length & 1 ? `0${hex}` : hex;
  }
  function hexToNumber(hex) {
      if (typeof hex !== 'string') {
          throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
      }
      return BigInt(`0x${hex}`);
  }
  function hexToBytes(hex) {
      if (typeof hex !== 'string') {
          throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
      }
      if (hex.length % 2)
          throw new Error('hexToBytes: received invalid unpadded hex' + hex.length);
      const array = new Uint8Array(hex.length / 2);
      for (let i = 0; i < array.length; i++) {
          const j = i * 2;
          const hexByte = hex.slice(j, j + 2);
          const byte = Number.parseInt(hexByte, 16);
          if (Number.isNaN(byte) || byte < 0)
              throw new Error('Invalid byte sequence');
          array[i] = byte;
      }
      return array;
  }
  function bytesToNumber(bytes) {
      return hexToNumber(bytesToHex(bytes));
  }
  function ensureBytes(hex) {
      return hex instanceof Uint8Array ? Uint8Array.from(hex) : hexToBytes(hex);
  }
  function normalizeScalar(num) {
      if (typeof num === 'number' && Number.isSafeInteger(num) && num > 0)
          return BigInt(num);
      if (typeof num === 'bigint' && isWithinCurveOrder(num))
          return num;
      throw new TypeError('Expected valid private scalar: 0 < scalar < curve.n');
  }
  function mod(a, b = CURVE.P) {
      const result = a % b;
      return result >= _0n$1 ? result : b + result;
  }
  function pow2(x, power) {
      const { P } = CURVE;
      let res = x;
      while (power-- > _0n$1) {
          res *= res;
          res %= P;
      }
      return res;
  }
  function sqrtMod(x) {
      const { P } = CURVE;
      const _6n = BigInt(6);
      const _11n = BigInt(11);
      const _22n = BigInt(22);
      const _23n = BigInt(23);
      const _44n = BigInt(44);
      const _88n = BigInt(88);
      const b2 = (x * x * x) % P;
      const b3 = (b2 * b2 * x) % P;
      const b6 = (pow2(b3, _3n) * b3) % P;
      const b9 = (pow2(b6, _3n) * b3) % P;
      const b11 = (pow2(b9, _2n$1) * b2) % P;
      const b22 = (pow2(b11, _11n) * b11) % P;
      const b44 = (pow2(b22, _22n) * b22) % P;
      const b88 = (pow2(b44, _44n) * b44) % P;
      const b176 = (pow2(b88, _88n) * b88) % P;
      const b220 = (pow2(b176, _44n) * b44) % P;
      const b223 = (pow2(b220, _3n) * b3) % P;
      const t1 = (pow2(b223, _23n) * b22) % P;
      const t2 = (pow2(t1, _6n) * b2) % P;
      return pow2(t2, _2n$1);
  }
  function invert(number, modulo = CURVE.P) {
      if (number === _0n$1 || modulo <= _0n$1) {
          throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
      }
      let a = mod(number, modulo);
      let b = modulo;
      let x = _0n$1, u = _1n$1;
      while (a !== _0n$1) {
          const q = b / a;
          const r = b % a;
          const m = x - u * q;
          b = a, a = r, x = u, u = m;
      }
      const gcd = b;
      if (gcd !== _1n$1)
          throw new Error('invert: does not exist');
      return mod(x, modulo);
  }
  function invertBatch(nums, p = CURVE.P) {
      const scratch = new Array(nums.length);
      const lastMultiplied = nums.reduce((acc, num, i) => {
          if (num === _0n$1)
              return acc;
          scratch[i] = acc;
          return mod(acc * num, p);
      }, _1n$1);
      const inverted = invert(lastMultiplied, p);
      nums.reduceRight((acc, num, i) => {
          if (num === _0n$1)
              return acc;
          scratch[i] = mod(acc * scratch[i], p);
          return mod(acc * num, p);
      }, inverted);
      return scratch;
  }
  const divNearest = (a, b) => (a + b / _2n$1) / b;
  const POW_2_128 = _2n$1 ** BigInt(128);
  function splitScalarEndo(k) {
      const { n } = CURVE;
      const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
      const b1 = -_1n$1 * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
      const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
      const b2 = a1;
      const c1 = divNearest(b2 * k, n);
      const c2 = divNearest(-b1 * k, n);
      let k1 = mod(k - c1 * a1 - c2 * a2, n);
      let k2 = mod(-c1 * b1 - c2 * b2, n);
      const k1neg = k1 > POW_2_128;
      const k2neg = k2 > POW_2_128;
      if (k1neg)
          k1 = n - k1;
      if (k2neg)
          k2 = n - k2;
      if (k1 > POW_2_128 || k2 > POW_2_128) {
          throw new Error('splitScalarEndo: Endomorphism failed, k=' + k);
      }
      return { k1neg, k1, k2neg, k2 };
  }
  function truncateHash(hash) {
      const { n } = CURVE;
      const byteLength = hash.length;
      const delta = byteLength * 8 - 256;
      let h = bytesToNumber(hash);
      if (delta > 0)
          h = h >> BigInt(delta);
      if (h >= n)
          h -= n;
      return h;
  }
  class HmacDrbg {
      constructor() {
          this.v = new Uint8Array(32).fill(1);
          this.k = new Uint8Array(32).fill(0);
          this.counter = 0;
      }
      hmac(...values) {
          return utils.hmacSha256(this.k, ...values);
      }
      hmacSync(...values) {
          if (typeof utils.hmacSha256Sync !== 'function')
              throw new Error('utils.hmacSha256Sync is undefined, you need to set it');
          const res = utils.hmacSha256Sync(this.k, ...values);
          if (res instanceof Promise)
              throw new Error('To use sync sign(), ensure utils.hmacSha256 is sync');
          return res;
      }
      incr() {
          if (this.counter >= 1000) {
              throw new Error('Tried 1,000 k values for sign(), all were invalid');
          }
          this.counter += 1;
      }
      async reseed(seed = new Uint8Array()) {
          this.k = await this.hmac(this.v, Uint8Array.from([0x00]), seed);
          this.v = await this.hmac(this.v);
          if (seed.length === 0)
              return;
          this.k = await this.hmac(this.v, Uint8Array.from([0x01]), seed);
          this.v = await this.hmac(this.v);
      }
      reseedSync(seed = new Uint8Array()) {
          this.k = this.hmacSync(this.v, Uint8Array.from([0x00]), seed);
          this.v = this.hmacSync(this.v);
          if (seed.length === 0)
              return;
          this.k = this.hmacSync(this.v, Uint8Array.from([0x01]), seed);
          this.v = this.hmacSync(this.v);
      }
      async generate() {
          this.incr();
          this.v = await this.hmac(this.v);
          return this.v;
      }
      generateSync() {
          this.incr();
          this.v = this.hmacSync(this.v);
          return this.v;
      }
  }
  function isWithinCurveOrder(num) {
      return _0n$1 < num && num < CURVE.n;
  }
  function isValidFieldElement(num) {
      return _0n$1 < num && num < CURVE.P;
  }
  function kmdToSig(kBytes, m, d) {
      const k = bytesToNumber(kBytes);
      if (!isWithinCurveOrder(k))
          return;
      const { n } = CURVE;
      const q = Point.BASE.multiply(k);
      const r = mod(q.x, n);
      if (r === _0n$1)
          return;
      const s = mod(invert(k, n) * mod(m + d * r, n), n);
      if (s === _0n$1)
          return;
      const sig = new Signature(r, s);
      const recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n$1);
      return { sig, recovery };
  }
  function normalizePrivateKey(key) {
      let num;
      if (typeof key === 'bigint') {
          num = key;
      }
      else if (typeof key === 'number' && Number.isSafeInteger(key) && key > 0) {
          num = BigInt(key);
      }
      else if (typeof key === 'string') {
          if (key.length !== 64)
              throw new Error('Expected 32 bytes of private key');
          num = hexToNumber(key);
      }
      else if (isUint8a(key)) {
          if (key.length !== 32)
              throw new Error('Expected 32 bytes of private key');
          num = bytesToNumber(key);
      }
      else {
          throw new TypeError('Expected valid private key');
      }
      if (!isWithinCurveOrder(num))
          throw new Error('Expected private key: 0 < key < n');
      return num;
  }
  function normalizeSignature(signature) {
      if (signature instanceof Signature) {
          signature.assertValidity();
          return signature;
      }
      try {
          return Signature.fromDER(signature);
      }
      catch (error) {
          return Signature.fromCompact(signature);
      }
  }
  function getPublicKey(privateKey, isCompressed = false) {
      return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function recoverPublicKey(msgHash, signature, recovery, isCompressed = false) {
      return Point.fromSignature(msgHash, signature, recovery).toRawBytes(isCompressed);
  }
  function bits2int(bytes) {
      const slice = bytes.length > 32 ? bytes.slice(0, 32) : bytes;
      return bytesToNumber(slice);
  }
  function bits2octets(bytes) {
      const z1 = bits2int(bytes);
      const z2 = mod(z1, CURVE.n);
      return int2octets(z2 < _0n$1 ? z1 : z2);
  }
  function int2octets(num) {
      if (typeof num !== 'bigint')
          throw new Error('Expected bigint');
      const hex = numTo32bStr(num);
      return hexToBytes(hex);
  }
  function initSigArgs(msgHash, privateKey, extraEntropy) {
      if (msgHash == null)
          throw new Error(`sign: expected valid message hash, not "${msgHash}"`);
      const h1 = ensureBytes(msgHash);
      const d = normalizePrivateKey(privateKey);
      const seedArgs = [int2octets(d), bits2octets(h1)];
      if (extraEntropy != null) {
          if (extraEntropy === true)
              extraEntropy = utils.randomBytes(32);
          const e = ensureBytes(extraEntropy);
          if (e.length !== 32)
              throw new Error('sign: Expected 32 bytes of extra data');
          seedArgs.push(e);
      }
      const seed = concatBytes(...seedArgs);
      const m = bits2int(h1);
      return { seed, m, d };
  }
  function finalizeSig(recSig, opts) {
      let { sig, recovery } = recSig;
      const { canonical, der, recovered } = Object.assign({ canonical: true, der: true }, opts);
      if (canonical && sig.hasHighS()) {
          sig = sig.normalizeS();
          recovery ^= 1;
      }
      const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
      return recovered ? [hashed, recovery] : hashed;
  }
  function signSync(msgHash, privKey, opts = {}) {
      const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
      let sig;
      const drbg = new HmacDrbg();
      drbg.reseedSync(seed);
      while (!(sig = kmdToSig(drbg.generateSync(), m, d)))
          drbg.reseedSync();
      return finalizeSig(sig, opts);
  }
  Point.BASE._setWindowSize(8);
  const crypto = {
      node: nodeCrypto,
      web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
  };
  const utils = {
      isValidPrivateKey(privateKey) {
          try {
              normalizePrivateKey(privateKey);
              return true;
          }
          catch (error) {
              return false;
          }
      },
      hashToPrivateKey: (hash) => {
          hash = ensureBytes(hash);
          if (hash.length < 40 || hash.length > 1024)
              throw new Error('Expected 40-1024 bytes of private key as per FIPS 186');
          const num = mod(bytesToNumber(hash), CURVE.n);
          if (num === _0n$1 || num === _1n$1)
              throw new Error('Invalid private key');
          return numTo32b(num);
      },
      randomBytes: (bytesLength = 32) => {
          if (crypto.web) {
              return crypto.web.getRandomValues(new Uint8Array(bytesLength));
          }
          else if (crypto.node) {
              const { randomBytes } = crypto.node;
              return Uint8Array.from(randomBytes(bytesLength));
          }
          else {
              throw new Error("The environment doesn't have randomBytes function");
          }
      },
      randomPrivateKey: () => {
          return utils.hashToPrivateKey(utils.randomBytes(40));
      },
      bytesToHex,
      mod,
      sha256: async (message) => {
          if (crypto.web) {
              const buffer = await crypto.web.subtle.digest('SHA-256', message.buffer);
              return new Uint8Array(buffer);
          }
          else if (crypto.node) {
              const { createHash } = crypto.node;
              return Uint8Array.from(createHash('sha256').update(message).digest());
          }
          else {
              throw new Error("The environment doesn't have sha256 function");
          }
      },
      hmacSha256: async (key, ...messages) => {
          if (crypto.web) {
              const ckey = await crypto.web.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
              const message = concatBytes(...messages);
              const buffer = await crypto.web.subtle.sign('HMAC', ckey, message);
              return new Uint8Array(buffer);
          }
          else if (crypto.node) {
              const { createHmac } = crypto.node;
              const hash = createHmac('sha256', key);
              messages.forEach((m) => hash.update(m));
              return Uint8Array.from(hash.digest());
          }
          else {
              throw new Error("The environment doesn't have hmac-sha256 function");
          }
      },
      sha256Sync: undefined,
      hmacSha256Sync: undefined,
      precompute(windowSize = 8, point = Point.BASE) {
          const cached = point === Point.BASE ? point : new Point(point.x, point.y);
          cached._setWindowSize(windowSize);
          cached.multiply(_3n);
          return cached;
      },
  };

  const asmJsInit = null;

  const chars$1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function base64Decode$1(data) {
    const bytes = [];
    let byte = 0;
    let bits = 0;
    for (let i = 0; i < data.length && data[i] !== '='; i++) {
      byte = byte << 6 | chars$1.indexOf(data[i]);
      if ((bits += 6) >= 8) {
        bytes.push(byte >>> (bits -= 8) & 0xff);
      }
    }
    return Uint8Array.from(bytes);
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  function commonjsRequire (path) {
  	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }

  const sizeCompressed = 171145;
  const sizeUncompressed$1 = 349919;
  const bytes$1 = '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';
  var bytes_1 = { bytes: bytes$1, sizeCompressed, sizeUncompressed: sizeUncompressed$1 };

  const bytes = bytes_1.bytes;
  const sizeUncompressed = bytes_1.sizeUncompressed;

  const u8 = Uint8Array,
        u16 = Uint16Array,
        u32$1 = Uint32Array;
  const clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  const fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
  0, 0,
  0]);
  const fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
  0, 0]);
  const freb = (eb, start) => {
    const b = new u16(31);
    for (let i = 0; i < 31; ++i) {
      b[i] = start += 1 << eb[i - 1];
    }
    const r = new u32$1(b[30]);
    for (let i = 1; i < 30; ++i) {
      for (let j = b[i]; j < b[i + 1]; ++j) {
        r[j] = j - b[i] << 5 | i;
      }
    }
    return [b, r];
  };
  const [fl, revfl] = freb(fleb, 2);
  fl[28] = 258, revfl[258] = 28;
  const [fd] = freb(fdeb, 0);
  const rev = new u16(32768);
  for (let i = 0; i < 32768; ++i) {
    let x = (i & 0xAAAA) >>> 1 | (i & 0x5555) << 1;
    x = (x & 0xCCCC) >>> 2 | (x & 0x3333) << 2;
    x = (x & 0xF0F0) >>> 4 | (x & 0x0F0F) << 4;
    rev[i] = ((x & 0xFF00) >>> 8 | (x & 0x00FF) << 8) >>> 1;
  }
  const hMap = (cd, mb, r) => {
    const s = cd.length;
    let i = 0;
    const l = new u16(mb);
    for (; i < s; ++i) ++l[cd[i] - 1];
    const le = new u16(mb);
    for (i = 0; i < mb; ++i) {
      le[i] = le[i - 1] + l[i - 1] << 1;
    }
    let co;
    if (r) {
      co = new u16(1 << mb);
      const rvb = 15 - mb;
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          const sv = i << 4 | cd[i];
          const r = mb - cd[i];
          let v = le[cd[i] - 1]++ << r;
          for (const m = v | (1 << r) - 1; v <= m; ++v) {
            co[rev[v] >>> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i = 0; i < s; ++i) co[i] = rev[le[cd[i] - 1]++] >>> 15 - cd[i];
    }
    return co;
  };
  const flt = new u8(288);
  for (let i = 0; i < 144; ++i) flt[i] = 8;
  for (let i = 144; i < 256; ++i) flt[i] = 9;
  for (let i = 256; i < 280; ++i) flt[i] = 7;
  for (let i = 280; i < 288; ++i) flt[i] = 8;
  const fdt = new u8(32);
  for (let i = 0; i < 32; ++i) fdt[i] = 5;
  const flrm = hMap(flt, 9, 1);
  const fdrm = hMap(fdt, 5, 1);
  const bits = (d, p, m) => {
    const o = p >>> 3;
    return (d[o] | d[o + 1] << 8) >>> (p & 7) & m;
  };
  const bits16 = (d, p) => {
    const o = p >>> 3;
    return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >>> (p & 7);
  };
  const shft = p => (p >>> 3) + (p & 7 && 1);
  const slc = (v, s, e) => {
    if (s == null || s < 0) s = 0;
    if (e == null || e > v.length) e = v.length;
    const n = new (v instanceof u16 ? u16 : v instanceof u32$1 ? u32$1 : u8)(e - s);
    n.set(v.subarray(s, e));
    return n;
  };
  const max = a => {
    let m = a[0];
    for (let i = 1; i < a.length; ++i) {
      if (a[i] > m) m = a[i];
    }
    return m;
  };
  const inflt = (dat, buf, st) => {
    const noSt = !st || st.i;
    if (!st) st = {};
    const sl = dat.length;
    const noBuf = !buf || !noSt;
    if (!buf) buf = new u8(sl * 3);
    const cbuf = l => {
      let bl = buf.length;
      if (l > bl) {
        const nbuf = new u8(Math.max(bl << 1, l));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    let final = st.f || 0,
        pos = st.p || 0,
        bt = st.b || 0,
        lm = st.l,
        dm = st.d,
        lbt = st.m,
        dbt = st.n;
    if (final && !lm) return buf;
    const tbts = sl << 3;
    do {
      if (!lm) {
        st.f = final = bits(dat, pos, 1);
        const type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          const s = shft(pos) + 4,
                l = dat[s - 4] | dat[s - 3] << 8,
                t = s + l;
          if (t > sl) {
            if (noSt) throw 'unexpected EOF';
            break;
          }
          if (noBuf) cbuf(bt + l);
          buf.set(dat.subarray(s, t), bt);
          st.b = bt += l, st.p = pos = t << 3;
          continue;
        } else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5;else if (type == 2) {
          const hLit = bits(dat, pos, 31) + 257,
                hcLen = bits(dat, pos + 10, 15) + 4;
          const tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          const ldt = new u8(tl);
          const clt = new u8(19);
          for (let i = 0; i < hcLen; ++i) {
            clt[clim[i]] = bits(dat, pos + i * 3, 7);
          }
          pos += hcLen * 3;
          const clb = max(clt),
                clbmsk = (1 << clb) - 1;
          if (!noSt && pos + tl * (clb + 7) > tbts) break;
          const clm = hMap(clt, clb, 1);
          for (let i = 0; i < tl;) {
            const r = clm[bits(dat, pos, clbmsk)];
            pos += r & 15;
            const s = r >>> 4;
            if (s < 16) {
              ldt[i++] = s;
            } else {
              let c = 0,
                  n = 0;
              if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];else if (s == 17) n = 3 + bits(dat, pos, 7), pos += 3;else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
              while (n--) ldt[i++] = c;
            }
          }
          const lt = ldt.subarray(0, hLit),
                dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else throw 'invalid block type';
        if (pos > tbts) throw 'unexpected EOF';
      }
      if (noBuf) cbuf(bt + 131072);
      const lms = (1 << lbt) - 1,
            dms = (1 << dbt) - 1;
      const mxa = lbt + dbt + 18;
      while (noSt || pos + mxa < tbts) {
        const c = lm[bits16(dat, pos) & lms],
              sym = c >>> 4;
        pos += c & 15;
        if (pos > tbts) throw 'unexpected EOF';
        if (!c) throw 'invalid length/literal';
        if (sym < 256) buf[bt++] = sym;else if (sym == 256) {
          lm = undefined;
          break;
        } else {
          let add = sym - 254;
          if (sym > 264) {
            const i = sym - 257,
                  b = fleb[i];
            add = bits(dat, pos, (1 << b) - 1) + fl[i];
            pos += b;
          }
          const d = dm[bits16(dat, pos) & dms],
                dsym = d >>> 4;
          if (!d) throw 'invalid distance';
          pos += d & 15;
          let dt = fd[dsym];
          if (dsym > 3) {
            const b = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
          }
          if (pos > tbts) throw 'unexpected EOF';
          if (noBuf) cbuf(bt + 131072);
          const end = bt + add;
          for (; bt < end; bt += 4) {
            buf[bt] = buf[bt - dt];
            buf[bt + 1] = buf[bt + 1 - dt];
            buf[bt + 2] = buf[bt + 2 - dt];
            buf[bt + 3] = buf[bt + 3 - dt];
          }
          bt = end;
        }
      }
      st.l = lm, st.p = pos, st.b = bt;
      if (lm) final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt == buf.length ? buf : slc(buf, 0, bt);
  };
  const zlv = d => {
    if ((d[0] & 15) != 8 || d[0] >>> 4 > 7 || (d[0] << 8 | d[1]) % 31) throw 'invalid zlib data';
    if (d[1] & 32) throw 'invalid zlib data: preset dictionaries not supported';
  };
  function unzlibSync(data, out) {
    return inflt((zlv(data), data.subarray(2, -4)), out);
  }

  const wasmBytes = unzlibSync(base64Decode$1(bytes), new Uint8Array(sizeUncompressed));

  let wasm = null;
  let cachegetInt32 = null;
  let cachegetUint8 = null;
  async function initWasm(wasmBytes, asmFn, wbg) {
    try {
      util.assert(typeof WebAssembly !== 'undefined' && wasmBytes && wasmBytes.length, 'WebAssembly is not available in your environment');
      const source = await WebAssembly.instantiate(wasmBytes, {
        wbg
      });
      wasm = source.instance.exports;
    } catch (error) {
      if (asmFn) {
        wasm = asmFn(wbg);
      } else {
        console.error('FATAL: Unable to initialize @polkadot/wasm-crypto');
        console.error(error);
        wasm = null;
      }
    }
  }
  function withWasm(fn) {
    return (...params) => {
      util.assert(wasm, 'The WASM interface has not been initialized. Ensure that you wait for the initialization Promise with waitReady() from @polkadot/wasm-crypto (or cryptoWaitReady() from @polkadot/util-crypto) before attempting to use WASM-only interfaces.');
      return fn(wasm, ...params);
    };
  }
  function getWasm() {
    return wasm;
  }
  function getInt32() {
    if (cachegetInt32 === null || cachegetInt32.buffer !== wasm.memory.buffer) {
      cachegetInt32 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32;
  }
  function getUint8() {
    if (cachegetUint8 === null || cachegetUint8.buffer !== wasm.memory.buffer) {
      cachegetUint8 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8;
  }
  function getU8a(ptr, len) {
    return getUint8().subarray(ptr / 1, ptr / 1 + len);
  }
  function getString(ptr, len) {
    return util.u8aToString(getU8a(ptr, len));
  }
  function allocU8a(arg) {
    const ptr = wasm.__wbindgen_malloc(arg.length * 1);
    getUint8().set(arg, ptr / 1);
    return [ptr, arg.length];
  }
  function allocString(arg) {
    return allocU8a(util.stringToU8a(arg));
  }
  function resultU8a() {
    const r0 = getInt32()[8 / 4 + 0];
    const r1 = getInt32()[8 / 4 + 1];
    const ret = getU8a(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return ret;
  }
  function resultString() {
    return util.u8aToString(resultU8a());
  }

  function getRandomValues(arr) {
    return xglobal.crypto.getRandomValues(arr);
  }

  const DEFAULT_CRYPTO = {
    getRandomValues
  };
  const DEFAULT_SELF = {
    crypto: DEFAULT_CRYPTO
  };
  const heap = new Array(32).fill(undefined).concat(undefined, null, true, false);
  let heapNext = heap.length;
  function getObject(idx) {
    return heap[idx];
  }
  function dropObject(idx) {
    if (idx < 36) {
      return;
    }
    heap[idx] = heapNext;
    heapNext = idx;
  }
  function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
  }
  function addObject(obj) {
    if (heapNext === heap.length) {
      heap.push(heap.length + 1);
    }
    const idx = heapNext;
    heapNext = heap[idx];
    heap[idx] = obj;
    return idx;
  }
  function __wbindgen_is_undefined(idx) {
    return getObject(idx) === undefined;
  }
  function __wbindgen_throw(ptr, len) {
    throw new Error(getString(ptr, len));
  }
  function __wbg_self_1b7a39e3a92c949c() {
    return addObject(DEFAULT_SELF);
  }
  function __wbg_require_604837428532a733(ptr, len) {
    throw new Error(`Unable to require ${getString(ptr, len)}`);
  }
  function __wbg_crypto_968f1772287e2df0(_idx) {
    return addObject(DEFAULT_CRYPTO);
  }
  function __wbg_getRandomValues_a3d34b4fee3c2869(_idx) {
    return addObject(DEFAULT_CRYPTO.getRandomValues);
  }
  function __wbg_getRandomValues_f5e14ab7ac8e995d(_arg0, ptr, len) {
    DEFAULT_CRYPTO.getRandomValues(getU8a(ptr, len));
  }
  function __wbg_randomFillSync_d5bd2d655fdf256a(_idx, _ptr, _len) {
    throw new Error('randomFillsync is not available');
  }
  function __wbindgen_object_drop_ref(idx) {
    takeObject(idx);
  }
  function abort() {
    throw new Error('abort');
  }

  const imports = /*#__PURE__*/Object.freeze({
    __proto__: null,
    __wbindgen_is_undefined: __wbindgen_is_undefined,
    __wbindgen_throw: __wbindgen_throw,
    __wbg_self_1b7a39e3a92c949c: __wbg_self_1b7a39e3a92c949c,
    __wbg_require_604837428532a733: __wbg_require_604837428532a733,
    __wbg_crypto_968f1772287e2df0: __wbg_crypto_968f1772287e2df0,
    __wbg_getRandomValues_a3d34b4fee3c2869: __wbg_getRandomValues_a3d34b4fee3c2869,
    __wbg_getRandomValues_f5e14ab7ac8e995d: __wbg_getRandomValues_f5e14ab7ac8e995d,
    __wbg_randomFillSync_d5bd2d655fdf256a: __wbg_randomFillSync_d5bd2d655fdf256a,
    __wbindgen_object_drop_ref: __wbindgen_object_drop_ref,
    abort: abort
  });

  const wasmPromise = initWasm(wasmBytes, asmJsInit, imports).catch(() => null);
  const bip39Generate = withWasm((wasm, words) => {
    wasm.ext_bip39_generate(8, words);
    return resultString();
  });
  const bip39ToEntropy = withWasm((wasm, phrase) => {
    wasm.ext_bip39_to_entropy(8, ...allocString(phrase));
    return resultU8a();
  });
  const bip39ToMiniSecret = withWasm((wasm, phrase, password) => {
    wasm.ext_bip39_to_mini_secret(8, ...allocString(phrase), ...allocString(password));
    return resultU8a();
  });
  const bip39ToSeed = withWasm((wasm, phrase, password) => {
    wasm.ext_bip39_to_seed(8, ...allocString(phrase), ...allocString(password));
    return resultU8a();
  });
  const bip39Validate = withWasm((wasm, phrase) => {
    const ret = wasm.ext_bip39_validate(...allocString(phrase));
    return ret !== 0;
  });
  const ed25519KeypairFromSeed = withWasm((wasm, seed) => {
    wasm.ext_ed_from_seed(8, ...allocU8a(seed));
    return resultU8a();
  });
  const ed25519Sign$1 = withWasm((wasm, pubkey, seckey, message) => {
    wasm.ext_ed_sign(8, ...allocU8a(pubkey), ...allocU8a(seckey), ...allocU8a(message));
    return resultU8a();
  });
  const ed25519Verify$1 = withWasm((wasm, signature, message, pubkey) => {
    const ret = wasm.ext_ed_verify(...allocU8a(signature), ...allocU8a(message), ...allocU8a(pubkey));
    return ret !== 0;
  });
  const secp256k1FromSeed = withWasm((wasm, seckey) => {
    wasm.ext_secp_from_seed(8, ...allocU8a(seckey));
    return resultU8a();
  });
  const secp256k1Compress$1 = withWasm((wasm, pubkey) => {
    wasm.ext_secp_pub_compress(8, ...allocU8a(pubkey));
    return resultU8a();
  });
  const secp256k1Expand$1 = withWasm((wasm, pubkey) => {
    wasm.ext_secp_pub_expand(8, ...allocU8a(pubkey));
    return resultU8a();
  });
  const secp256k1Recover$1 = withWasm((wasm, msgHash, sig, recovery) => {
    wasm.ext_secp_recover(8, ...allocU8a(msgHash), ...allocU8a(sig), recovery);
    return resultU8a();
  });
  const secp256k1Sign$1 = withWasm((wasm, msgHash, seckey) => {
    wasm.ext_secp_sign(8, ...allocU8a(msgHash), ...allocU8a(seckey));
    return resultU8a();
  });
  const sr25519DeriveKeypairHard = withWasm((wasm, pair, cc) => {
    wasm.ext_sr_derive_keypair_hard(8, ...allocU8a(pair), ...allocU8a(cc));
    return resultU8a();
  });
  const sr25519DeriveKeypairSoft = withWasm((wasm, pair, cc) => {
    wasm.ext_sr_derive_keypair_soft(8, ...allocU8a(pair), ...allocU8a(cc));
    return resultU8a();
  });
  const sr25519DerivePublicSoft = withWasm((wasm, pubkey, cc) => {
    wasm.ext_sr_derive_public_soft(8, ...allocU8a(pubkey), ...allocU8a(cc));
    return resultU8a();
  });
  const sr25519KeypairFromSeed = withWasm((wasm, seed) => {
    wasm.ext_sr_from_seed(8, ...allocU8a(seed));
    return resultU8a();
  });
  const sr25519Sign$1 = withWasm((wasm, pubkey, secret, message) => {
    wasm.ext_sr_sign(8, ...allocU8a(pubkey), ...allocU8a(secret), ...allocU8a(message));
    return resultU8a();
  });
  const sr25519Verify$1 = withWasm((wasm, signature, message, pubkey) => {
    const ret = wasm.ext_sr_verify(...allocU8a(signature), ...allocU8a(message), ...allocU8a(pubkey));
    return ret !== 0;
  });
  const sr25519Agree = withWasm((wasm, pubkey, secret) => {
    wasm.ext_sr_agree(8, ...allocU8a(pubkey), ...allocU8a(secret));
    return resultU8a();
  });
  const vrfSign = withWasm((wasm, secret, context, message, extra) => {
    wasm.ext_vrf_sign(8, ...allocU8a(secret), ...allocU8a(context), ...allocU8a(message), ...allocU8a(extra));
    return resultU8a();
  });
  const vrfVerify = withWasm((wasm, pubkey, context, message, extra, outAndProof) => {
    const ret = wasm.ext_vrf_verify(...allocU8a(pubkey), ...allocU8a(context), ...allocU8a(message), ...allocU8a(extra), ...allocU8a(outAndProof));
    return ret !== 0;
  });
  const blake2b$1 = withWasm((wasm, data, key, size) => {
    wasm.ext_blake2b(8, ...allocU8a(data), ...allocU8a(key), size);
    return resultU8a();
  });
  const hmacSha256 = withWasm((wasm, key, data) => {
    wasm.ext_hmac_sha256(8, ...allocU8a(key), ...allocU8a(data));
    return resultU8a();
  });
  const hmacSha512 = withWasm((wasm, key, data) => {
    wasm.ext_hmac_sha512(8, ...allocU8a(key), ...allocU8a(data));
    return resultU8a();
  });
  const keccak256 = withWasm((wasm, data) => {
    wasm.ext_keccak256(8, ...allocU8a(data));
    return resultU8a();
  });
  const keccak512 = withWasm((wasm, data) => {
    wasm.ext_keccak512(8, ...allocU8a(data));
    return resultU8a();
  });
  const pbkdf2$1 = withWasm((wasm, data, salt, rounds) => {
    wasm.ext_pbkdf2(8, ...allocU8a(data), ...allocU8a(salt), rounds);
    return resultU8a();
  });
  const scrypt$1 = withWasm((wasm, password, salt, log2n, r, p) => {
    wasm.ext_scrypt(8, ...allocU8a(password), ...allocU8a(salt), log2n, r, p);
    return resultU8a();
  });
  const sha256$1 = withWasm((wasm, data) => {
    wasm.ext_sha256(8, ...allocU8a(data));
    return resultU8a();
  });
  const sha512$1 = withWasm((wasm, data) => {
    wasm.ext_sha512(8, ...allocU8a(data));
    return resultU8a();
  });
  const twox = withWasm((wasm, data, rounds) => {
    wasm.ext_twox(8, ...allocU8a(data), rounds);
    return resultU8a();
  });
  function isReady() {
    return !!getWasm();
  }
  function waitReady() {
    return wasmPromise.then(() => isReady());
  }

  const cryptoIsReady = isReady;
  function cryptoWaitReady() {
    return waitReady().then(() => {
      util.assert(isReady(), 'Unable to initialize @polkadot/util-crypto');
      return true;
    }).catch(() => false);
  }

  /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
  const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
  const isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
  if (!isLE)
      throw new Error('Non little-endian hardware is not supported');
  Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
  (() => {
      const nodeRequire = typeof module !== 'undefined' &&
          typeof module.require === 'function' &&
          module.require.bind(module);
      try {
          if (nodeRequire) {
              const { setImmediate } = nodeRequire('timers');
              return () => new Promise((resolve) => setImmediate(resolve));
          }
      }
      catch (e) { }
      return () => new Promise((resolve) => setTimeout(resolve, 0));
  })();
  function utf8ToBytes(str) {
      if (typeof str !== 'string') {
          throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
      }
      return new TextEncoder().encode(str);
  }
  function toBytes(data) {
      if (typeof data === 'string')
          data = utf8ToBytes(data);
      if (!(data instanceof Uint8Array))
          throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
      return data;
  }
  function assertNumber(n) {
      if (!Number.isSafeInteger(n) || n < 0)
          throw new Error(`Wrong positive integer: ${n}`);
  }
  function assertHash(hash) {
      if (typeof hash !== 'function' || typeof hash.create !== 'function')
          throw new Error('Hash should be wrapped by utils.wrapConstructor');
      assertNumber(hash.outputLen);
      assertNumber(hash.blockLen);
  }
  class Hash {
      clone() {
          return this._cloneInto();
      }
  }
  const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]' && obj.constructor === Object;
  function checkOpts(def, _opts) {
      if (_opts !== undefined && (typeof _opts !== 'object' || !isPlainObject(_opts)))
          throw new TypeError('Options should be object or undefined');
      const opts = Object.assign(def, _opts);
      return opts;
  }
  function wrapConstructor(hashConstructor) {
      const hashC = (message) => hashConstructor().update(toBytes(message)).digest();
      const tmp = hashConstructor();
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = () => hashConstructor();
      return hashC;
  }
  function wrapConstructorWithOpts(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
  }

  class HMAC extends Hash {
      constructor(hash, _key) {
          super();
          this.finished = false;
          this.destroyed = false;
          assertHash(hash);
          const key = toBytes(_key);
          this.iHash = hash.create();
          if (!(this.iHash instanceof Hash))
              throw new TypeError('Expected instance of class which extends utils.Hash');
          const blockLen = (this.blockLen = this.iHash.blockLen);
          this.outputLen = this.iHash.outputLen;
          const pad = new Uint8Array(blockLen);
          pad.set(key.length > this.iHash.blockLen ? hash.create().update(key).digest() : key);
          for (let i = 0; i < pad.length; i++)
              pad[i] ^= 0x36;
          this.iHash.update(pad);
          this.oHash = hash.create();
          for (let i = 0; i < pad.length; i++)
              pad[i] ^= 0x36 ^ 0x5c;
          this.oHash.update(pad);
          pad.fill(0);
      }
      update(buf) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          this.iHash.update(buf);
          return this;
      }
      digestInto(out) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          if (!(out instanceof Uint8Array) || out.length !== this.outputLen)
              throw new Error('HMAC: Invalid output buffer');
          if (this.finished)
              throw new Error('digest() was already called');
          this.finished = true;
          this.iHash.digestInto(out);
          this.oHash.update(out);
          this.oHash.digestInto(out);
          this.destroy();
      }
      digest() {
          const out = new Uint8Array(this.oHash.outputLen);
          this.digestInto(out);
          return out;
      }
      _cloneInto(to) {
          to || (to = Object.create(Object.getPrototypeOf(this), {}));
          const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
          to = to;
          to.finished = finished;
          to.destroyed = destroyed;
          to.blockLen = blockLen;
          to.outputLen = outputLen;
          to.oHash = oHash._cloneInto(to.oHash);
          to.iHash = iHash._cloneInto(to.iHash);
          return to;
      }
      destroy() {
          this.destroyed = true;
          this.oHash.destroy();
          this.iHash.destroy();
      }
  }
  const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
  hmac.create = (hash, key) => new HMAC(hash, key);

  function setBigUint64(view, byteOffset, value, isLE) {
      if (typeof view.setBigUint64 === 'function')
          return view.setBigUint64(byteOffset, value, isLE);
      const _32n = BigInt(32);
      const _u32_max = BigInt(0xffffffff);
      const wh = Number((value >> _32n) & _u32_max);
      const wl = Number(value & _u32_max);
      const h = isLE ? 4 : 0;
      const l = isLE ? 0 : 4;
      view.setUint32(byteOffset + h, wh, isLE);
      view.setUint32(byteOffset + l, wl, isLE);
  }
  class SHA2 extends Hash {
      constructor(blockLen, outputLen, padOffset, isLE) {
          super();
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE;
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.buffer = new Uint8Array(blockLen);
          this.view = createView(this.buffer);
      }
      update(data) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          const { view, buffer, blockLen, finished } = this;
          if (finished)
              throw new Error('digest() was already called');
          data = toBytes(data);
          const len = data.length;
          for (let pos = 0; pos < len;) {
              const take = Math.min(blockLen - this.pos, len - pos);
              if (take === blockLen) {
                  const dataView = createView(data);
                  for (; blockLen <= len - pos; pos += blockLen)
                      this.process(dataView, pos);
                  continue;
              }
              buffer.set(data.subarray(pos, pos + take), this.pos);
              this.pos += take;
              pos += take;
              if (this.pos === blockLen) {
                  this.process(view, 0);
                  this.pos = 0;
              }
          }
          this.length += data.length;
          this.roundClean();
          return this;
      }
      digestInto(out) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          if (!(out instanceof Uint8Array) || out.length < this.outputLen)
              throw new Error('_Sha2: Invalid output buffer');
          if (this.finished)
              throw new Error('digest() was already called');
          this.finished = true;
          const { buffer, view, blockLen, isLE } = this;
          let { pos } = this;
          buffer[pos++] = 0b10000000;
          this.buffer.subarray(pos).fill(0);
          if (this.padOffset > blockLen - pos) {
              this.process(view, 0);
              pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
              buffer[i] = 0;
          setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
          this.process(view, 0);
          const oview = createView(out);
          this.get().forEach((v, i) => oview.setUint32(4 * i, v, isLE));
      }
      digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
      }
      _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.length = length;
          to.pos = pos;
          to.finished = finished;
          to.destroyed = destroyed;
          if (length % blockLen)
              to.buffer.set(buffer);
          return to;
      }
  }

  const Chi = (a, b, c) => (a & b) ^ (~a & c);
  const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
  const SHA256_K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  const IV$1 = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const SHA256_W = new Uint32Array(64);
  class SHA256 extends SHA2 {
      constructor() {
          super(64, 32, 8, false);
          this.A = IV$1[0] | 0;
          this.B = IV$1[1] | 0;
          this.C = IV$1[2] | 0;
          this.D = IV$1[3] | 0;
          this.E = IV$1[4] | 0;
          this.F = IV$1[5] | 0;
          this.G = IV$1[6] | 0;
          this.H = IV$1[7] | 0;
      }
      get() {
          const { A, B, C, D, E, F, G, H } = this;
          return [A, B, C, D, E, F, G, H];
      }
      set(A, B, C, D, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
      }
      process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
              SHA256_W[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
              const W15 = SHA256_W[i - 15];
              const W2 = SHA256_W[i - 2];
              const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
              const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
              SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
          }
          let { A, B, C, D, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
              const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
              const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
              const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
              const T2 = (sigma0 + Maj(A, B, C)) | 0;
              H = G;
              G = F;
              F = E;
              E = (D + T1) | 0;
              D = C;
              C = B;
              B = A;
              A = (T1 + T2) | 0;
          }
          A = (A + this.A) | 0;
          B = (B + this.B) | 0;
          C = (C + this.C) | 0;
          D = (D + this.D) | 0;
          E = (E + this.E) | 0;
          F = (F + this.F) | 0;
          G = (G + this.G) | 0;
          H = (H + this.H) | 0;
          this.set(A, B, C, D, E, F, G, H);
      }
      roundClean() {
          SHA256_W.fill(0);
      }
      destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          this.buffer.fill(0);
      }
  }
  const sha256 = wrapConstructor(() => new SHA256());

  const U32_MASK64 = BigInt(2 ** 32 - 1);
  const _32n$1 = BigInt(32);
  function fromBig(n, le = false) {
      if (le)
          return { h: Number(n & U32_MASK64), l: Number((n >> _32n$1) & U32_MASK64) };
      return { h: Number((n >> _32n$1) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
      let Ah = new Uint32Array(lst.length);
      let Al = new Uint32Array(lst.length);
      for (let i = 0; i < lst.length; i++) {
          const { h, l } = fromBig(lst[i], le);
          [Ah[i], Al[i]] = [h, l];
      }
      return [Ah, Al];
  }
  const shrSH = (h, l, s) => h >>> s;
  const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
  const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
  const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
  const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
  const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
  const rotr32H = (h, l) => l;
  const rotr32L = (h, l) => h;
  const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
  const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
  const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
  const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
  function add(Ah, Al, Bh, Bl) {
      const l = (Al >>> 0) + (Bl >>> 0);
      return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
  }
  const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
  const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
  const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;

  const [SHA512_Kh, SHA512_Kl] = split([
      '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
      '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
      '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
      '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
      '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
      '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
      '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
      '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
      '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
      '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
      '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
      '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
      '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
      '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
      '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
      '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
      '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
      '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
      '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
      '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
  ].map(n => BigInt(n)));
  const SHA512_W_H = new Uint32Array(80);
  const SHA512_W_L = new Uint32Array(80);
  class SHA512 extends SHA2 {
      constructor() {
          super(128, 64, 16, false);
          this.Ah = 0x6a09e667 | 0;
          this.Al = 0xf3bcc908 | 0;
          this.Bh = 0xbb67ae85 | 0;
          this.Bl = 0x84caa73b | 0;
          this.Ch = 0x3c6ef372 | 0;
          this.Cl = 0xfe94f82b | 0;
          this.Dh = 0xa54ff53a | 0;
          this.Dl = 0x5f1d36f1 | 0;
          this.Eh = 0x510e527f | 0;
          this.El = 0xade682d1 | 0;
          this.Fh = 0x9b05688c | 0;
          this.Fl = 0x2b3e6c1f | 0;
          this.Gh = 0x1f83d9ab | 0;
          this.Gl = 0xfb41bd6b | 0;
          this.Hh = 0x5be0cd19 | 0;
          this.Hl = 0x137e2179 | 0;
      }
      get() {
          const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
      }
      set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
          this.Ah = Ah | 0;
          this.Al = Al | 0;
          this.Bh = Bh | 0;
          this.Bl = Bl | 0;
          this.Ch = Ch | 0;
          this.Cl = Cl | 0;
          this.Dh = Dh | 0;
          this.Dl = Dl | 0;
          this.Eh = Eh | 0;
          this.El = El | 0;
          this.Fh = Fh | 0;
          this.Fl = Fl | 0;
          this.Gh = Gh | 0;
          this.Gl = Gl | 0;
          this.Hh = Hh | 0;
          this.Hl = Hl | 0;
      }
      process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4) {
              SHA512_W_H[i] = view.getUint32(offset);
              SHA512_W_L[i] = view.getUint32((offset += 4));
          }
          for (let i = 16; i < 80; i++) {
              const W15h = SHA512_W_H[i - 15] | 0;
              const W15l = SHA512_W_L[i - 15] | 0;
              const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
              const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
              const W2h = SHA512_W_H[i - 2] | 0;
              const W2l = SHA512_W_L[i - 2] | 0;
              const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
              const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
              const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
              const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
              SHA512_W_H[i] = SUMh | 0;
              SHA512_W_L[i] = SUMl | 0;
          }
          let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          for (let i = 0; i < 80; i++) {
              const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
              const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
              const CHIh = (Eh & Fh) ^ (~Eh & Gh);
              const CHIl = (El & Fl) ^ (~El & Gl);
              const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
              const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
              const T1l = T1ll | 0;
              const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
              const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
              const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
              const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
              Hh = Gh | 0;
              Hl = Gl | 0;
              Gh = Fh | 0;
              Gl = Fl | 0;
              Fh = Eh | 0;
              Fl = El | 0;
              ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
              Dh = Ch | 0;
              Dl = Cl | 0;
              Ch = Bh | 0;
              Cl = Bl | 0;
              Bh = Ah | 0;
              Bl = Al | 0;
              const All = add3L(T1l, sigma0l, MAJl);
              Ah = add3H(All, T1h, sigma0h, MAJh);
              Al = All | 0;
          }
          ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
          ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
          ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
          ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
          ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
          ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
          ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
          ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
          this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
      }
      roundClean() {
          SHA512_W_H.fill(0);
          SHA512_W_L.fill(0);
      }
      destroy() {
          this.buffer.fill(0);
          this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
  }
  class SHA512_256 extends SHA512 {
      constructor() {
          super();
          this.Ah = 0x22312194 | 0;
          this.Al = 0xfc2bf72c | 0;
          this.Bh = 0x9f555fa3 | 0;
          this.Bl = 0xc84c64c2 | 0;
          this.Ch = 0x2393b86b | 0;
          this.Cl = 0x6f53b151 | 0;
          this.Dh = 0x96387719 | 0;
          this.Dl = 0x5940eabd | 0;
          this.Eh = 0x96283ee2 | 0;
          this.El = 0xa88effe3 | 0;
          this.Fh = 0xbe5e1e25 | 0;
          this.Fl = 0x53863992 | 0;
          this.Gh = 0x2b0199fc | 0;
          this.Gl = 0x2c85b8aa | 0;
          this.Hh = 0x0eb72ddc | 0;
          this.Hl = 0x81c52ca2 | 0;
          this.outputLen = 32;
      }
  }
  class SHA384 extends SHA512 {
      constructor() {
          super();
          this.Ah = 0xcbbb9d5d | 0;
          this.Al = 0xc1059ed8 | 0;
          this.Bh = 0x629a292a | 0;
          this.Bl = 0x367cd507 | 0;
          this.Ch = 0x9159015a | 0;
          this.Cl = 0x3070dd17 | 0;
          this.Dh = 0x152fecd8 | 0;
          this.Dl = 0xf70e5939 | 0;
          this.Eh = 0x67332667 | 0;
          this.El = 0xffc00b31 | 0;
          this.Fh = 0x8eb44a87 | 0;
          this.Fl = 0x68581511 | 0;
          this.Gh = 0xdb0c2e0d | 0;
          this.Gl = 0x64f98fa7 | 0;
          this.Hh = 0x47b5481d | 0;
          this.Hl = 0xbefa4fa4 | 0;
          this.outputLen = 48;
      }
  }
  const sha512 = wrapConstructor(() => new SHA512());
  wrapConstructor(() => new SHA512_256());
  wrapConstructor(() => new SHA384());

  const JS_HASH = {
    256: sha256,
    512: sha512
  };
  const WA_MHAC = {
    256: hmacSha256,
    512: hmacSha512
  };
  function createSha(bitLength) {
    return (key, data, onlyJs) => hmacShaAsU8a(key, data, bitLength, onlyJs);
  }
  function hmacShaAsU8a(key, data, bitLength = 256, onlyJs) {
    const u8aKey = util.u8aToU8a(key);
    return !util.hasBigInt || !onlyJs && isReady() ? WA_MHAC[bitLength](u8aKey, data) : hmac(JS_HASH[bitLength], u8aKey, data);
  }
  const hmacSha256AsU8a = createSha(256);
  const hmacSha512AsU8a = createSha(512);

  utils.hmacSha256Sync = (key, ...messages) => hmacSha256AsU8a(key, util.u8aConcat(...messages));
  cryptoWaitReady().catch(() => {
  });

  const packageInfo = {
    name: '@polkadot/util-crypto',
    path: (({ url: (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('bundle-polkadot-util-crypto.js', document.baseURI).href)) }) && (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('bundle-polkadot-util-crypto.js', document.baseURI).href))) ? new URL('.', (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('bundle-polkadot-util-crypto.js', document.baseURI).href))).pathname : 'auto',
    type: 'esm',
    version: '8.5.1'
  };

  var base = {};

  (function (exports) {
  /*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bytes = exports.stringToBytes = exports.str = exports.bytesToString = exports.hex = exports.utf8 = exports.bech32m = exports.bech32 = exports.base58check = exports.base58xmr = exports.base58xrp = exports.base58flickr = exports.base58 = exports.base64url = exports.base64 = exports.base32crockford = exports.base32hex = exports.base32 = exports.base16 = exports.utils = exports.assertNumber = void 0;
  function assertNumber(n) {
      if (!Number.isSafeInteger(n))
          throw new Error(`Wrong integer: ${n}`);
  }
  exports.assertNumber = assertNumber;
  function chain(...args) {
      const wrap = (a, b) => (c) => a(b(c));
      const encode = Array.from(args)
          .reverse()
          .reduce((acc, i) => (acc ? wrap(acc, i.encode) : i.encode), undefined);
      const decode = args.reduce((acc, i) => (acc ? wrap(acc, i.decode) : i.decode), undefined);
      return { encode, decode };
  }
  function alphabet(alphabet) {
      return {
          encode: (digits) => {
              if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                  throw new Error('alphabet.encode input should be an array of numbers');
              return digits.map((i) => {
                  assertNumber(i);
                  if (i < 0 || i >= alphabet.length)
                      throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
                  return alphabet[i];
              });
          },
          decode: (input) => {
              if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
                  throw new Error('alphabet.decode input should be array of strings');
              return input.map((letter) => {
                  if (typeof letter !== 'string')
                      throw new Error(`alphabet.decode: not string element=${letter}`);
                  const index = alphabet.indexOf(letter);
                  if (index === -1)
                      throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
                  return index;
              });
          },
      };
  }
  function join(separator = '') {
      if (typeof separator !== 'string')
          throw new Error('join separator should be string');
      return {
          encode: (from) => {
              if (!Array.isArray(from) || (from.length && typeof from[0] !== 'string'))
                  throw new Error('join.encode input should be array of strings');
              for (let i of from)
                  if (typeof i !== 'string')
                      throw new Error(`join.encode: non-string input=${i}`);
              return from.join(separator);
          },
          decode: (to) => {
              if (typeof to !== 'string')
                  throw new Error('join.decode input should be string');
              return to.split(separator);
          },
      };
  }
  function padding(bits, chr = '=') {
      assertNumber(bits);
      if (typeof chr !== 'string')
          throw new Error('padding chr should be string');
      return {
          encode(data) {
              if (!Array.isArray(data) || (data.length && typeof data[0] !== 'string'))
                  throw new Error('padding.encode input should be array of strings');
              for (let i of data)
                  if (typeof i !== 'string')
                      throw new Error(`padding.encode: non-string input=${i}`);
              while ((data.length * bits) % 8)
                  data.push(chr);
              return data;
          },
          decode(input) {
              if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
                  throw new Error('padding.encode input should be array of strings');
              for (let i of input)
                  if (typeof i !== 'string')
                      throw new Error(`padding.decode: non-string input=${i}`);
              let end = input.length;
              if ((end * bits) % 8)
                  throw new Error('Invalid padding: string should have whole number of bytes');
              for (; end > 0 && input[end - 1] === chr; end--) {
                  if (!(((end - 1) * bits) % 8))
                      throw new Error('Invalid padding: string has too much padding');
              }
              return input.slice(0, end);
          },
      };
  }
  function normalize(fn) {
      if (typeof fn !== 'function')
          throw new Error('normalize fn should be function');
      return { encode: (from) => from, decode: (to) => fn(to) };
  }
  function convertRadix(data, from, to) {
      if (from < 2)
          throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
      if (to < 2)
          throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
      if (!Array.isArray(data))
          throw new Error('convertRadix: data should be array');
      if (!data.length)
          return [];
      let pos = 0;
      const res = [];
      const digits = Array.from(data);
      digits.forEach((d) => {
          assertNumber(d);
          if (d < 0 || d >= from)
              throw new Error(`Wrong integer: ${d}`);
      });
      while (true) {
          let carry = 0;
          let done = true;
          for (let i = pos; i < digits.length; i++) {
              const digit = digits[i];
              const digitBase = from * carry + digit;
              if (!Number.isSafeInteger(digitBase) ||
                  (from * carry) / from !== carry ||
                  digitBase - digit !== from * carry) {
                  throw new Error('convertRadix: carry overflow');
              }
              carry = digitBase % to;
              digits[i] = Math.floor(digitBase / to);
              if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase)
                  throw new Error('convertRadix: carry overflow');
              if (!done)
                  continue;
              else if (!digits[i])
                  pos = i;
              else
                  done = false;
          }
          res.push(carry);
          if (done)
              break;
      }
      for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
          res.push(0);
      return res.reverse();
  }
  const gcd = (a, b) => (!b ? a : gcd(b, a % b));
  const radix2carry = (from, to) => from + (to - gcd(from, to));
  function convertRadix2(data, from, to, padding) {
      if (!Array.isArray(data))
          throw new Error('convertRadix2: data should be array');
      if (from <= 0 || from > 32)
          throw new Error(`convertRadix2: wrong from=${from}`);
      if (to <= 0 || to > 32)
          throw new Error(`convertRadix2: wrong to=${to}`);
      if (radix2carry(from, to) > 32) {
          throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
      }
      let carry = 0;
      let pos = 0;
      const mask = 2 ** to - 1;
      const res = [];
      for (const n of data) {
          assertNumber(n);
          if (n >= 2 ** from)
              throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
          carry = (carry << from) | n;
          if (pos + from > 32)
              throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
          pos += from;
          for (; pos >= to; pos -= to)
              res.push(((carry >> (pos - to)) & mask) >>> 0);
          carry &= 2 ** pos - 1;
      }
      carry = (carry << (to - pos)) & mask;
      if (!padding && pos >= from)
          throw new Error('Excess padding');
      if (!padding && carry)
          throw new Error(`Non-zero padding: ${carry}`);
      if (padding && pos > 0)
          res.push(carry >>> 0);
      return res;
  }
  function radix(num) {
      assertNumber(num);
      return {
          encode: (bytes) => {
              if (!(bytes instanceof Uint8Array))
                  throw new Error('radix.encode input should be Uint8Array');
              return convertRadix(Array.from(bytes), 2 ** 8, num);
          },
          decode: (digits) => {
              if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                  throw new Error('radix.decode input should be array of strings');
              return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
          },
      };
  }
  function radix2(bits, revPadding = false) {
      assertNumber(bits);
      if (bits <= 0 || bits > 32)
          throw new Error('radix2: bits should be in (0..32]');
      if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
          throw new Error('radix2: carry overflow');
      return {
          encode: (bytes) => {
              if (!(bytes instanceof Uint8Array))
                  throw new Error('radix2.encode input should be Uint8Array');
              return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
          },
          decode: (digits) => {
              if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                  throw new Error('radix2.decode input should be array of strings');
              return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
          },
      };
  }
  function unsafeWrapper(fn) {
      if (typeof fn !== 'function')
          throw new Error('unsafeWrapper fn should be function');
      return function (...args) {
          try {
              return fn.apply(null, args);
          }
          catch (e) { }
      };
  }
  function checksum(len, fn) {
      assertNumber(len);
      if (typeof fn !== 'function')
          throw new Error('checksum fn should be function');
      return {
          encode(data) {
              if (!(data instanceof Uint8Array))
                  throw new Error('checksum.encode: input should be Uint8Array');
              const checksum = fn(data).slice(0, len);
              const res = new Uint8Array(data.length + len);
              res.set(data);
              res.set(checksum, data.length);
              return res;
          },
          decode(data) {
              if (!(data instanceof Uint8Array))
                  throw new Error('checksum.decode: input should be Uint8Array');
              const payload = data.slice(0, -len);
              const newChecksum = fn(payload).slice(0, len);
              const oldChecksum = data.slice(-len);
              for (let i = 0; i < len; i++)
                  if (newChecksum[i] !== oldChecksum[i])
                      throw new Error('Invalid checksum');
              return payload;
          },
      };
  }
  exports.utils = { alphabet, chain, checksum, radix, radix2, join, padding };
  exports.base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
  exports.base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
  exports.base32hex = chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
  exports.base32crockford = chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize((s) => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
  exports.base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
  exports.base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
  const genBase58 = (abc) => chain(radix(58), alphabet(abc), join(''));
  exports.base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
  exports.base58flickr = genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
  exports.base58xrp = genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
  const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
  exports.base58xmr = {
      encode(data) {
          let res = '';
          for (let i = 0; i < data.length; i += 8) {
              const block = data.subarray(i, i + 8);
              res += exports.base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
          }
          return res;
      },
      decode(str) {
          let res = [];
          for (let i = 0; i < str.length; i += 11) {
              const slice = str.slice(i, i + 11);
              const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
              const block = exports.base58.decode(slice);
              for (let j = 0; j < block.length - blockLen; j++) {
                  if (block[j] !== 0)
                      throw new Error('base58xmr: wrong padding');
              }
              res = res.concat(Array.from(block.slice(block.length - blockLen)));
          }
          return Uint8Array.from(res);
      },
  };
  const base58check = (sha256) => chain(checksum(4, (data) => sha256(sha256(data))), exports.base58);
  exports.base58check = base58check;
  const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
  const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  function bech32Polymod(pre) {
      const b = pre >> 25;
      let chk = (pre & 0x1ffffff) << 5;
      for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
          if (((b >> i) & 1) === 1)
              chk ^= POLYMOD_GENERATORS[i];
      }
      return chk;
  }
  function bechChecksum(prefix, words, encodingConst = 1) {
      const len = prefix.length;
      let chk = 1;
      for (let i = 0; i < len; i++) {
          const c = prefix.charCodeAt(i);
          if (c < 33 || c > 126)
              throw new Error(`Invalid prefix (${prefix})`);
          chk = bech32Polymod(chk) ^ (c >> 5);
      }
      chk = bech32Polymod(chk);
      for (let i = 0; i < len; i++)
          chk = bech32Polymod(chk) ^ (prefix.charCodeAt(i) & 0x1f);
      for (let v of words)
          chk = bech32Polymod(chk) ^ v;
      for (let i = 0; i < 6; i++)
          chk = bech32Polymod(chk);
      chk ^= encodingConst;
      return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
  }
  function genBech32(encoding) {
      const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
      const _words = radix2(5);
      const fromWords = _words.decode;
      const toWords = _words.encode;
      const fromWordsUnsafe = unsafeWrapper(fromWords);
      function encode(prefix, words, limit = 90) {
          if (typeof prefix !== 'string')
              throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
          if (!Array.isArray(words) || (words.length && typeof words[0] !== 'number'))
              throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
          const actualLength = prefix.length + 7 + words.length;
          if (limit !== false && actualLength > limit)
              throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
          prefix = prefix.toLowerCase();
          return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
      }
      function decode(str, limit = 90) {
          if (typeof str !== 'string')
              throw new Error(`bech32.decode input should be string, not ${typeof str}`);
          if (str.length < 8 || (limit !== false && str.length > limit))
              throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
          const lowered = str.toLowerCase();
          if (str !== lowered && str !== str.toUpperCase())
              throw new Error(`String must be lowercase or uppercase`);
          str = lowered;
          const sepIndex = str.lastIndexOf('1');
          if (sepIndex === 0 || sepIndex === -1)
              throw new Error(`Letter "1" must be present between prefix and data only`);
          const [prefix, _words] = [str.slice(0, sepIndex), str.slice(sepIndex + 1)];
          if (_words.length < 6)
              throw new Error('Data must be at least 6 characters long');
          const words = BECH_ALPHABET.decode(_words).slice(0, -6);
          const sum = bechChecksum(prefix, words, ENCODING_CONST);
          if (!_words.endsWith(sum))
              throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
          return { prefix, words };
      }
      const decodeUnsafe = unsafeWrapper(decode);
      function decodeToBytes(str) {
          const { prefix, words } = decode(str, false);
          return { prefix, words, bytes: fromWords(words) };
      }
      return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
  }
  exports.bech32 = genBech32('bech32');
  exports.bech32m = genBech32('bech32m');
  exports.utf8 = {
      encode: (data) => new TextDecoder().decode(data),
      decode: (str) => new TextEncoder().encode(str),
  };
  exports.hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize((s) => {
      if (typeof s !== 'string' || s.length % 2)
          throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
      return s.toLowerCase();
  }));
  const CODERS = {
      utf8: exports.utf8, hex: exports.hex, base16: exports.base16, base32: exports.base32, base64: exports.base64, base64url: exports.base64url, base58: exports.base58, base58xmr: exports.base58xmr
  };
  const coderTypeError = `Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;
  const bytesToString = (type, bytes) => {
      if (typeof type !== 'string' || !CODERS.hasOwnProperty(type))
          throw new TypeError(coderTypeError);
      if (!(bytes instanceof Uint8Array))
          throw new TypeError('bytesToString() expects Uint8Array');
      return CODERS[type].encode(bytes);
  };
  exports.bytesToString = bytesToString;
  exports.str = exports.bytesToString;
  const stringToBytes = (type, str) => {
      if (!CODERS.hasOwnProperty(type))
          throw new TypeError(coderTypeError);
      if (typeof str !== 'string')
          throw new TypeError('stringToBytes() expects string');
      return CODERS[type].decode(str);
  };
  exports.stringToBytes = stringToBytes;
  exports.bytes = exports.stringToBytes;
  }(base));
  getDefaultExportFromCjs(base);

  function createDecode({
    coder,
    ipfs
  }, validate) {
    return (value, ipfsCompat) => {
      validate(value, ipfsCompat);
      return coder.decode(ipfs && ipfsCompat ? value.substr(1) : value);
    };
  }
  function createEncode({
    coder,
    ipfs
  }) {
    return (value, ipfsCompat) => {
      const out = coder.encode(util.u8aToU8a(value));
      return ipfs && ipfsCompat ? `${ipfs}${out}` : out;
    };
  }
  function createIs(validate) {
    return (value, ipfsCompat) => {
      try {
        return validate(value, ipfsCompat);
      } catch (error) {
        return false;
      }
    };
  }
  function createValidate({
    chars,
    ipfs,
    type
  }) {
    return (value, ipfsCompat) => {
      util.assert(value && typeof value === 'string', () => `Expected non-null, non-empty ${type} string input`);
      if (ipfs && ipfsCompat) {
        util.assert(value[0] === ipfs, () => `Expected ipfs-compatible ${type} to start with '${ipfs}'`);
      }
      for (let i = ipfsCompat ? 1 : 0; i < value.length; i++) {
        util.assert(chars.includes(value[i]) || value[i] === '=' && (i === value.length - 1 || !chars.includes(value[i + 1])), () => `Invalid ${type} character "${value[i]}" (0x${value.charCodeAt(i).toString(16)}) at index ${i}`);
      }
      return true;
    };
  }

  const config$2 = {
    chars: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
    coder: base.base58,
    ipfs: 'z',
    type: 'base58'
  };
  const base58Validate = createValidate(config$2);
  const base58Decode = createDecode(config$2, base58Validate);
  const base58Encode = createEncode(config$2);
  const isBase58 = createIs(base58Validate);

  const SIGMA = new Uint8Array([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
      11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
      7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
      9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
      2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
      12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
      13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
      6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
      10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  ]);
  class BLAKE2 extends Hash {
      constructor(blockLen, outputLen, opts = {}, keyLen, saltLen, persLen) {
          super();
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.length = 0;
          this.pos = 0;
          this.finished = false;
          this.destroyed = false;
          assertNumber(blockLen);
          assertNumber(outputLen);
          assertNumber(keyLen);
          if (outputLen < 0 || outputLen > keyLen)
              throw new Error('Blake2: outputLen bigger than keyLen');
          if (opts.key !== undefined && (opts.key.length < 1 || opts.key.length > keyLen))
              throw new Error(`Key should be up 1..${keyLen} byte long or undefined`);
          if (opts.salt !== undefined && opts.salt.length !== saltLen)
              throw new Error(`Salt should be ${saltLen} byte long or undefined`);
          if (opts.personalization !== undefined && opts.personalization.length !== persLen)
              throw new Error(`Personalization should be ${persLen} byte long or undefined`);
          this.buffer32 = u32((this.buffer = new Uint8Array(blockLen)));
      }
      update(data) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          const { finished, blockLen, buffer, buffer32 } = this;
          if (finished)
              throw new Error('digest() was already called');
          data = toBytes(data);
          const len = data.length;
          for (let pos = 0; pos < len;) {
              if (this.pos === blockLen) {
                  this.compress(buffer32, 0, false);
                  this.pos = 0;
              }
              const take = Math.min(blockLen - this.pos, len - pos);
              const dataOffset = data.byteOffset + pos;
              if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
                  const data32 = new Uint32Array(data.buffer, dataOffset, Math.floor((len - pos) / 4));
                  for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
                      this.length += blockLen;
                      this.compress(data32, pos32, false);
                  }
                  continue;
              }
              buffer.set(data.subarray(pos, pos + take), this.pos);
              this.pos += take;
              this.length += take;
              pos += take;
          }
          return this;
      }
      digestInto(out) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          if (!(out instanceof Uint8Array) || out.length < this.outputLen)
              throw new Error('_Blake2: Invalid output buffer');
          const { finished, pos, buffer32 } = this;
          if (finished)
              throw new Error('digest() was already called');
          this.finished = true;
          this.buffer.subarray(pos).fill(0);
          this.compress(buffer32, 0, true);
          const out32 = u32(out);
          this.get().forEach((v, i) => (out32[i] = v));
      }
      digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
      }
      _cloneInto(to) {
          const { buffer, length, finished, destroyed, outputLen, pos } = this;
          to || (to = new this.constructor({ dkLen: outputLen }));
          to.set(...this.get());
          to.length = length;
          to.finished = finished;
          to.destroyed = destroyed;
          to.outputLen = outputLen;
          to.buffer.set(buffer);
          to.pos = pos;
          return to;
      }
  }

  const IV = new Uint32Array([
      0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
      0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
  ]);
  const BUF = new Uint32Array(32);
  function G1(a, b, c, d, msg, x) {
      const Xl = msg[x], Xh = msg[x + 1];
      let Al = BUF[2 * a], Ah = BUF[2 * a + 1];
      let Bl = BUF[2 * b], Bh = BUF[2 * b + 1];
      let Cl = BUF[2 * c], Ch = BUF[2 * c + 1];
      let Dl = BUF[2 * d], Dh = BUF[2 * d + 1];
      let ll = add3L(Al, Bl, Xl);
      Ah = add3H(ll, Ah, Bh, Xh);
      Al = ll | 0;
      ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
      ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh) });
      ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
      ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
      ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
      (BUF[2 * a] = Al), (BUF[2 * a + 1] = Ah);
      (BUF[2 * b] = Bl), (BUF[2 * b + 1] = Bh);
      (BUF[2 * c] = Cl), (BUF[2 * c + 1] = Ch);
      (BUF[2 * d] = Dl), (BUF[2 * d + 1] = Dh);
  }
  function G2(a, b, c, d, msg, x) {
      const Xl = msg[x], Xh = msg[x + 1];
      let Al = BUF[2 * a], Ah = BUF[2 * a + 1];
      let Bl = BUF[2 * b], Bh = BUF[2 * b + 1];
      let Cl = BUF[2 * c], Ch = BUF[2 * c + 1];
      let Dl = BUF[2 * d], Dh = BUF[2 * d + 1];
      let ll = add3L(Al, Bl, Xl);
      Ah = add3H(ll, Ah, Bh, Xh);
      Al = ll | 0;
      ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
      ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
      ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
      ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
      ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
      (BUF[2 * a] = Al), (BUF[2 * a + 1] = Ah);
      (BUF[2 * b] = Bl), (BUF[2 * b + 1] = Bh);
      (BUF[2 * c] = Cl), (BUF[2 * c + 1] = Ch);
      (BUF[2 * d] = Dl), (BUF[2 * d + 1] = Dh);
  }
  class BLAKE2b extends BLAKE2 {
      constructor(opts = {}) {
          super(128, opts.dkLen === undefined ? 64 : opts.dkLen, opts, 64, 16, 16);
          this.v0l = IV[0] | 0;
          this.v0h = IV[1] | 0;
          this.v1l = IV[2] | 0;
          this.v1h = IV[3] | 0;
          this.v2l = IV[4] | 0;
          this.v2h = IV[5] | 0;
          this.v3l = IV[6] | 0;
          this.v3h = IV[7] | 0;
          this.v4l = IV[8] | 0;
          this.v4h = IV[9] | 0;
          this.v5l = IV[10] | 0;
          this.v5h = IV[11] | 0;
          this.v6l = IV[12] | 0;
          this.v6h = IV[13] | 0;
          this.v7l = IV[14] | 0;
          this.v7h = IV[15] | 0;
          const keyLength = opts.key ? opts.key.length : 0;
          this.v0l ^= this.outputLen | (keyLength << 8) | (0x01 << 16) | (0x01 << 24);
          if (opts.salt) {
              const salt = u32(toBytes(opts.salt));
              this.v4l ^= salt[0];
              this.v4h ^= salt[1];
              this.v5l ^= salt[2];
              this.v5h ^= salt[3];
          }
          if (opts.personalization) {
              const pers = u32(toBytes(opts.personalization));
              this.v6l ^= pers[0];
              this.v6h ^= pers[1];
              this.v7l ^= pers[2];
              this.v7h ^= pers[3];
          }
          if (opts.key) {
              const tmp = new Uint8Array(this.blockLen);
              tmp.set(toBytes(opts.key));
              this.update(tmp);
          }
      }
      get() {
          let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
          return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
      }
      set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
          this.v0l = v0l | 0;
          this.v0h = v0h | 0;
          this.v1l = v1l | 0;
          this.v1h = v1h | 0;
          this.v2l = v2l | 0;
          this.v2h = v2h | 0;
          this.v3l = v3l | 0;
          this.v3h = v3h | 0;
          this.v4l = v4l | 0;
          this.v4h = v4h | 0;
          this.v5l = v5l | 0;
          this.v5h = v5h | 0;
          this.v6l = v6l | 0;
          this.v6h = v6h | 0;
          this.v7l = v7l | 0;
          this.v7h = v7h | 0;
      }
      compress(msg, offset, isLast) {
          this.get().forEach((v, i) => (BUF[i] = v));
          BUF.set(IV, 16);
          let { h, l } = fromBig(BigInt(this.length));
          BUF[24] = IV[8] ^ l;
          BUF[25] = IV[9] ^ h;
          if (isLast) {
              BUF[28] = ~BUF[28];
              BUF[29] = ~BUF[29];
          }
          let j = 0;
          const s = SIGMA;
          for (let i = 0; i < 12; i++) {
              G1(0, 4, 8, 12, msg, offset + 2 * s[j++]);
              G2(0, 4, 8, 12, msg, offset + 2 * s[j++]);
              G1(1, 5, 9, 13, msg, offset + 2 * s[j++]);
              G2(1, 5, 9, 13, msg, offset + 2 * s[j++]);
              G1(2, 6, 10, 14, msg, offset + 2 * s[j++]);
              G2(2, 6, 10, 14, msg, offset + 2 * s[j++]);
              G1(3, 7, 11, 15, msg, offset + 2 * s[j++]);
              G2(3, 7, 11, 15, msg, offset + 2 * s[j++]);
              G1(0, 5, 10, 15, msg, offset + 2 * s[j++]);
              G2(0, 5, 10, 15, msg, offset + 2 * s[j++]);
              G1(1, 6, 11, 12, msg, offset + 2 * s[j++]);
              G2(1, 6, 11, 12, msg, offset + 2 * s[j++]);
              G1(2, 7, 8, 13, msg, offset + 2 * s[j++]);
              G2(2, 7, 8, 13, msg, offset + 2 * s[j++]);
              G1(3, 4, 9, 14, msg, offset + 2 * s[j++]);
              G2(3, 4, 9, 14, msg, offset + 2 * s[j++]);
          }
          this.v0l ^= BUF[0] ^ BUF[16];
          this.v0h ^= BUF[1] ^ BUF[17];
          this.v1l ^= BUF[2] ^ BUF[18];
          this.v1h ^= BUF[3] ^ BUF[19];
          this.v2l ^= BUF[4] ^ BUF[20];
          this.v2h ^= BUF[5] ^ BUF[21];
          this.v3l ^= BUF[6] ^ BUF[22];
          this.v3h ^= BUF[7] ^ BUF[23];
          this.v4l ^= BUF[8] ^ BUF[24];
          this.v4h ^= BUF[9] ^ BUF[25];
          this.v5l ^= BUF[10] ^ BUF[26];
          this.v5h ^= BUF[11] ^ BUF[27];
          this.v6l ^= BUF[12] ^ BUF[28];
          this.v6h ^= BUF[13] ^ BUF[29];
          this.v7l ^= BUF[14] ^ BUF[30];
          this.v7h ^= BUF[15] ^ BUF[31];
          BUF.fill(0);
      }
      destroy() {
          this.destroyed = true;
          this.buffer32.fill(0);
          this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
  }
  const blake2b = wrapConstructorWithOpts((opts) => new BLAKE2b(opts));

  function createAsHex(fn) {
    return (...args) => util.u8aToHex(fn(...args));
  }
  function createBitHasher(bitLength, fn) {
    return (data, onlyJs) => fn(data, bitLength, onlyJs);
  }
  function createDualHasher(wa, js) {
    return (value, bitLength = 256, onlyJs) => {
      const u8a = util.u8aToU8a(value);
      return !util.hasBigInt || !onlyJs && isReady() ? wa[bitLength](u8a) : js[bitLength](u8a);
    };
  }

  function blake2AsU8a(data, bitLength = 256, key, onlyJs) {
    const byteLength = Math.ceil(bitLength / 8);
    const u8a = util.u8aToU8a(data);
    return !util.hasBigInt || !onlyJs && isReady() ? blake2b$1(u8a, util.u8aToU8a(key), byteLength) : blake2b(u8a, {
      dkLen: byteLength,
      key: key || undefined
    });
  }
  const blake2AsHex = createAsHex(blake2AsU8a);

  const SS58_PREFIX = util.stringToU8a('SS58PRE');
  function sshash(key) {
    return blake2AsU8a(util.u8aConcat(SS58_PREFIX, key), 512);
  }

  function checkAddressChecksum(decoded) {
    const ss58Length = decoded[0] & 0b01000000 ? 2 : 1;
    const ss58Decoded = ss58Length === 1 ? decoded[0] : (decoded[0] & 0b00111111) << 2 | decoded[1] >> 6 | (decoded[1] & 0b00111111) << 8;
    const isPublicKey = [34 + ss58Length, 35 + ss58Length].includes(decoded.length);
    const length = decoded.length - (isPublicKey ? 2 : 1);
    const hash = sshash(decoded.subarray(0, length));
    const isValid = (decoded[0] & 0b10000000) === 0 && ![46, 47].includes(decoded[0]) && (isPublicKey ? decoded[decoded.length - 2] === hash[0] && decoded[decoded.length - 1] === hash[1] : decoded[decoded.length - 1] === hash[0]);
    return [isValid, length, ss58Length, ss58Decoded];
  }

  const knownSubstrate = [
  	{
  		"prefix": 0,
  		"network": "polkadot",
  		"displayName": "Polkadot Relay Chain",
  		"symbols": [
  			"DOT"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://polkadot.network"
  	},
  	{
  		"prefix": 1,
  		"network": "BareSr25519",
  		"displayName": "Bare 32-bit Schnorr/Ristretto (S/R 25519) public key.",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "Sr25519",
  		"website": null
  	},
  	{
  		"prefix": 2,
  		"network": "kusama",
  		"displayName": "Kusama Relay Chain",
  		"symbols": [
  			"KSM"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://kusama.network"
  	},
  	{
  		"prefix": 3,
  		"network": "BareEd25519",
  		"displayName": "Bare 32-bit Ed25519 public key.",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "Ed25519",
  		"website": null
  	},
  	{
  		"prefix": 4,
  		"network": "katalchain",
  		"displayName": "Katal Chain",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": null
  	},
  	{
  		"prefix": 5,
  		"network": "astar",
  		"displayName": "Astar Network",
  		"symbols": [
  			"ASTR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://astar.network"
  	},
  	{
  		"prefix": 6,
  		"network": "bifrost",
  		"displayName": "Bifrost",
  		"symbols": [
  			"BNC"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://bifrost.finance/"
  	},
  	{
  		"prefix": 7,
  		"network": "edgeware",
  		"displayName": "Edgeware",
  		"symbols": [
  			"EDG"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://edgewa.re"
  	},
  	{
  		"prefix": 8,
  		"network": "karura",
  		"displayName": "Karura",
  		"symbols": [
  			"KAR"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://karura.network/"
  	},
  	{
  		"prefix": 9,
  		"network": "reynolds",
  		"displayName": "Laminar Reynolds Canary",
  		"symbols": [
  			"REY"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "http://laminar.network/"
  	},
  	{
  		"prefix": 10,
  		"network": "acala",
  		"displayName": "Acala",
  		"symbols": [
  			"ACA"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://acala.network/"
  	},
  	{
  		"prefix": 11,
  		"network": "laminar",
  		"displayName": "Laminar",
  		"symbols": [
  			"LAMI"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "http://laminar.network/"
  	},
  	{
  		"prefix": 12,
  		"network": "polymesh",
  		"displayName": "Polymesh",
  		"symbols": [
  			"POLYX"
  		],
  		"decimals": [
  			6
  		],
  		"standardAccount": "*25519",
  		"website": "https://polymath.network/"
  	},
  	{
  		"prefix": 13,
  		"network": "integritee",
  		"displayName": "Integritee",
  		"symbols": [
  			"TEER"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://integritee.network"
  	},
  	{
  		"prefix": 14,
  		"network": "totem",
  		"displayName": "Totem",
  		"symbols": [
  			"TOTEM"
  		],
  		"decimals": [
  			0
  		],
  		"standardAccount": "*25519",
  		"website": "https://totemaccounting.com"
  	},
  	{
  		"prefix": 15,
  		"network": "synesthesia",
  		"displayName": "Synesthesia",
  		"symbols": [
  			"SYN"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://synesthesia.network/"
  	},
  	{
  		"prefix": 16,
  		"network": "kulupu",
  		"displayName": "Kulupu",
  		"symbols": [
  			"KLP"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://kulupu.network/"
  	},
  	{
  		"prefix": 17,
  		"network": "dark",
  		"displayName": "Dark Mainnet",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": null
  	},
  	{
  		"prefix": 18,
  		"network": "darwinia",
  		"displayName": "Darwinia Network",
  		"symbols": [
  			"RING",
  			"KTON"
  		],
  		"decimals": [
  			9,
  			9
  		],
  		"standardAccount": "*25519",
  		"website": "https://darwinia.network/"
  	},
  	{
  		"prefix": 19,
  		"network": "geek",
  		"displayName": "GeekCash",
  		"symbols": [
  			"GEEK"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://geekcash.org"
  	},
  	{
  		"prefix": 20,
  		"network": "stafi",
  		"displayName": "Stafi",
  		"symbols": [
  			"FIS"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://stafi.io"
  	},
  	{
  		"prefix": 21,
  		"network": "dock-testnet",
  		"displayName": "Dock Testnet",
  		"symbols": [
  			"DCK"
  		],
  		"decimals": [
  			6
  		],
  		"standardAccount": "*25519",
  		"website": "https://dock.io"
  	},
  	{
  		"prefix": 22,
  		"network": "dock-mainnet",
  		"displayName": "Dock Mainnet",
  		"symbols": [
  			"DCK"
  		],
  		"decimals": [
  			6
  		],
  		"standardAccount": "*25519",
  		"website": "https://dock.io"
  	},
  	{
  		"prefix": 23,
  		"network": "shift",
  		"displayName": "ShiftNrg",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": null
  	},
  	{
  		"prefix": 24,
  		"network": "zero",
  		"displayName": "ZERO",
  		"symbols": [
  			"ZERO"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://zero.io"
  	},
  	{
  		"prefix": 25,
  		"network": "zero-alphaville",
  		"displayName": "ZERO Alphaville",
  		"symbols": [
  			"ZERO"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://zero.io"
  	},
  	{
  		"prefix": 26,
  		"network": "jupiter",
  		"displayName": "Jupiter",
  		"symbols": [
  			"jDOT"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://jupiter.patract.io"
  	},
  	{
  		"prefix": 27,
  		"network": "kabocha",
  		"displayName": "Kabocha",
  		"symbols": [
  			"KAB"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://kabocha.network"
  	},
  	{
  		"prefix": 28,
  		"network": "subsocial",
  		"displayName": "Subsocial",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": null
  	},
  	{
  		"prefix": 29,
  		"network": "cord",
  		"displayName": "CORD Network",
  		"symbols": [
  			"DHI",
  			"WAY"
  		],
  		"decimals": [
  			12,
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://cord.network/"
  	},
  	{
  		"prefix": 30,
  		"network": "phala",
  		"displayName": "Phala Network",
  		"symbols": [
  			"PHA"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://phala.network"
  	},
  	{
  		"prefix": 31,
  		"network": "litentry",
  		"displayName": "Litentry Network",
  		"symbols": [
  			"LIT"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://litentry.com/"
  	},
  	{
  		"prefix": 32,
  		"network": "robonomics",
  		"displayName": "Robonomics",
  		"symbols": [
  			"XRT"
  		],
  		"decimals": [
  			9
  		],
  		"standardAccount": "*25519",
  		"website": "https://robonomics.network"
  	},
  	{
  		"prefix": 33,
  		"network": "datahighway",
  		"displayName": "DataHighway",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": null
  	},
  	{
  		"prefix": 34,
  		"network": "ares",
  		"displayName": "Ares Protocol",
  		"symbols": [
  			"ARES"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://www.aresprotocol.com/"
  	},
  	{
  		"prefix": 35,
  		"network": "vln",
  		"displayName": "Valiu Liquidity Network",
  		"symbols": [
  			"USDv"
  		],
  		"decimals": [
  			15
  		],
  		"standardAccount": "*25519",
  		"website": "https://valiu.com/"
  	},
  	{
  		"prefix": 36,
  		"network": "centrifuge",
  		"displayName": "Centrifuge Chain",
  		"symbols": [
  			"CFG"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://centrifuge.io/"
  	},
  	{
  		"prefix": 37,
  		"network": "nodle",
  		"displayName": "Nodle Chain",
  		"symbols": [
  			"NODL"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://nodle.io/"
  	},
  	{
  		"prefix": 38,
  		"network": "kilt",
  		"displayName": "KILT Chain",
  		"symbols": [
  			"KILT"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://kilt.io/"
  	},
  	{
  		"prefix": 39,
  		"network": "mathchain",
  		"displayName": "MathChain mainnet",
  		"symbols": [
  			"MATH"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://mathwallet.org"
  	},
  	{
  		"prefix": 40,
  		"network": "mathchain-testnet",
  		"displayName": "MathChain testnet",
  		"symbols": [
  			"MATH"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://mathwallet.org"
  	},
  	{
  		"prefix": 41,
  		"network": "poli",
  		"displayName": "Polimec Chain",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": "https://polimec.io/"
  	},
  	{
  		"prefix": 42,
  		"network": "substrate",
  		"displayName": "Substrate",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": "https://substrate.io/"
  	},
  	{
  		"prefix": 43,
  		"network": "BareSecp256k1",
  		"displayName": "Bare 32-bit ECDSA SECP-256k1 public key.",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "secp256k1",
  		"website": null
  	},
  	{
  		"prefix": 44,
  		"network": "chainx",
  		"displayName": "ChainX",
  		"symbols": [
  			"PCX"
  		],
  		"decimals": [
  			8
  		],
  		"standardAccount": "*25519",
  		"website": "https://chainx.org/"
  	},
  	{
  		"prefix": 45,
  		"network": "uniarts",
  		"displayName": "UniArts Network",
  		"symbols": [
  			"UART",
  			"UINK"
  		],
  		"decimals": [
  			12,
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://uniarts.me"
  	},
  	{
  		"prefix": 46,
  		"network": "reserved46",
  		"displayName": "This prefix is reserved.",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": null,
  		"website": null
  	},
  	{
  		"prefix": 47,
  		"network": "reserved47",
  		"displayName": "This prefix is reserved.",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": null,
  		"website": null
  	},
  	{
  		"prefix": 48,
  		"network": "neatcoin",
  		"displayName": "Neatcoin Mainnet",
  		"symbols": [
  			"NEAT"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://neatcoin.org"
  	},
  	{
  		"prefix": 49,
  		"network": "picasso",
  		"displayName": "Picasso",
  		"symbols": [
  			"PICA"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://picasso.composable.finance"
  	},
  	{
  		"prefix": 50,
  		"network": "composable",
  		"displayName": "Composable",
  		"symbols": [
  			"LAYR"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://composable.finance"
  	},
  	{
  		"prefix": 51,
  		"network": "oak",
  		"displayName": "OAK Network",
  		"symbols": [
  			"OAK"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://oak.tech"
  	},
  	{
  		"prefix": 52,
  		"network": "KICO",
  		"displayName": "KICO",
  		"symbols": [
  			"KICO"
  		],
  		"decimals": [
  			14
  		],
  		"standardAccount": "*25519",
  		"website": "https://dico.io"
  	},
  	{
  		"prefix": 53,
  		"network": "DICO",
  		"displayName": "DICO",
  		"symbols": [
  			"DICO"
  		],
  		"decimals": [
  			14
  		],
  		"standardAccount": "*25519",
  		"website": "https://dico.io"
  	},
  	{
  		"prefix": 55,
  		"network": "xxnetwork",
  		"displayName": "xx network",
  		"symbols": [
  			"XX"
  		],
  		"decimals": [
  			9
  		],
  		"standardAccount": "*25519",
  		"website": "https://xx.network"
  	},
  	{
  		"prefix": 63,
  		"network": "hydradx",
  		"displayName": "HydraDX",
  		"symbols": [
  			"HDX"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://hydradx.io"
  	},
  	{
  		"prefix": 65,
  		"network": "aventus",
  		"displayName": "AvN Mainnet",
  		"symbols": [
  			"AVT"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://aventus.io"
  	},
  	{
  		"prefix": 66,
  		"network": "crust",
  		"displayName": "Crust Network",
  		"symbols": [
  			"CRU"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://crust.network"
  	},
  	{
  		"prefix": 67,
  		"network": "genshiro",
  		"displayName": "Genshiro Network",
  		"symbols": [
  			"GENS",
  			"EQD",
  			"LPT0"
  		],
  		"decimals": [
  			9,
  			9,
  			9
  		],
  		"standardAccount": "*25519",
  		"website": "https://genshiro.equilibrium.io"
  	},
  	{
  		"prefix": 68,
  		"network": "equilibrium",
  		"displayName": "Equilibrium Network",
  		"symbols": [
  			"EQ"
  		],
  		"decimals": [
  			9
  		],
  		"standardAccount": "*25519",
  		"website": "https://equilibrium.io"
  	},
  	{
  		"prefix": 69,
  		"network": "sora",
  		"displayName": "SORA Network",
  		"symbols": [
  			"XOR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://sora.org"
  	},
  	{
  		"prefix": 73,
  		"network": "zeitgeist",
  		"displayName": "Zeitgeist",
  		"symbols": [
  			"ZTG"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://zeitgeist.pm"
  	},
  	{
  		"prefix": 77,
  		"network": "manta",
  		"displayName": "Manta network",
  		"symbols": [
  			"MANTA"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://manta.network"
  	},
  	{
  		"prefix": 78,
  		"network": "calamari",
  		"displayName": "Calamari: Manta Canary Network",
  		"symbols": [
  			"KMA"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://manta.network"
  	},
  	{
  		"prefix": 88,
  		"network": "polkadex",
  		"displayName": "Polkadex Mainnet",
  		"symbols": [
  			"PDEX"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://polkadex.trade"
  	},
  	{
  		"prefix": 98,
  		"network": "polkasmith",
  		"displayName": "PolkaSmith Canary Network",
  		"symbols": [
  			"PKS"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://polkafoundry.com"
  	},
  	{
  		"prefix": 99,
  		"network": "polkafoundry",
  		"displayName": "PolkaFoundry Network",
  		"symbols": [
  			"PKF"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://polkafoundry.com"
  	},
  	{
  		"prefix": 101,
  		"network": "origintrail-parachain",
  		"displayName": "OriginTrail Parachain",
  		"symbols": [
  			"TRAC"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "secp256k1",
  		"website": "https://origintrail.io"
  	},
  	{
  		"prefix": 105,
  		"network": "pontem-network",
  		"displayName": "Pontem Network",
  		"symbols": [
  			"PONT"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://pontem.network"
  	},
  	{
  		"prefix": 110,
  		"network": "heiko",
  		"displayName": "Heiko",
  		"symbols": [
  			"HKO"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://parallel.fi/"
  	},
  	{
  		"prefix": 113,
  		"network": "integritee-incognito",
  		"displayName": "Integritee Incognito",
  		"symbols": [],
  		"decimals": [],
  		"standardAccount": "*25519",
  		"website": "https://integritee.network"
  	},
  	{
  		"prefix": 128,
  		"network": "clover",
  		"displayName": "Clover Finance",
  		"symbols": [
  			"CLV"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://clover.finance"
  	},
  	{
  		"prefix": 131,
  		"network": "litmus",
  		"displayName": "Litmus Network",
  		"symbols": [
  			"LIT"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://litentry.com/"
  	},
  	{
  		"prefix": 136,
  		"network": "altair",
  		"displayName": "Altair",
  		"symbols": [
  			"AIR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://centrifuge.io/"
  	},
  	{
  		"prefix": 172,
  		"network": "parallel",
  		"displayName": "Parallel",
  		"symbols": [
  			"PARA"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://parallel.fi/"
  	},
  	{
  		"prefix": 252,
  		"network": "social-network",
  		"displayName": "Social Network",
  		"symbols": [
  			"NET"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://social.network"
  	},
  	{
  		"prefix": 255,
  		"network": "quartz_mainnet",
  		"displayName": "QUARTZ by UNIQUE",
  		"symbols": [
  			"QTZ"
  		],
  		"decimals": [
  			15
  		],
  		"standardAccount": "*25519",
  		"website": "https://unique.network"
  	},
  	{
  		"prefix": 268,
  		"network": "pioneer_network",
  		"displayName": "Pioneer Network by Bit.Country",
  		"symbols": [
  			"NEER"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://bit.country"
  	},
  	{
  		"prefix": 420,
  		"network": "sora_kusama_para",
  		"displayName": "SORA Kusama Parachain",
  		"symbols": [
  			"XOR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://sora.org"
  	},
  	{
  		"prefix": 1110,
  		"network": "efinity",
  		"displayName": "Efinity",
  		"symbols": [
  			"EFI"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "Sr25519",
  		"website": "https://efinity.io/"
  	},
  	{
  		"prefix": 1284,
  		"network": "moonbeam",
  		"displayName": "Moonbeam",
  		"symbols": [
  			"GLMR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "secp256k1",
  		"website": "https://moonbeam.network"
  	},
  	{
  		"prefix": 1285,
  		"network": "moonriver",
  		"displayName": "Moonriver",
  		"symbols": [
  			"MOVR"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "secp256k1",
  		"website": "https://moonbeam.network"
  	},
  	{
  		"prefix": 1337,
  		"network": "ajuna",
  		"displayName": "Ajuna Network",
  		"symbols": [
  			"AJUN"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "Sr25519",
  		"website": "https://ajuna.io"
  	},
  	{
  		"prefix": 2007,
  		"network": "kapex",
  		"displayName": "Kapex",
  		"symbols": [
  			"KAPEX"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://totemaccounting.com"
  	},
  	{
  		"prefix": 2032,
  		"network": "interlay",
  		"displayName": "Interlay",
  		"symbols": [
  			"INTR"
  		],
  		"decimals": [
  			10
  		],
  		"standardAccount": "*25519",
  		"website": "https://interlay.io/"
  	},
  	{
  		"prefix": 2092,
  		"network": "kintsugi",
  		"displayName": "Kintsugi",
  		"symbols": [
  			"KINT"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://interlay.io/"
  	},
  	{
  		"prefix": 2254,
  		"network": "subspace_testnet",
  		"displayName": "Subspace testnet",
  		"symbols": [
  			"tSSC"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://subspace.network"
  	},
  	{
  		"prefix": 6094,
  		"network": "subspace",
  		"displayName": "Subspace",
  		"symbols": [
  			"SSC"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://subspace.network"
  	},
  	{
  		"prefix": 7391,
  		"network": "unique_mainnet",
  		"displayName": "Unique Network",
  		"symbols": [
  			"UNQ"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://unique.network"
  	},
  	{
  		"prefix": 10041,
  		"network": "basilisk",
  		"displayName": "Basilisk",
  		"symbols": [
  			"BSX"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://bsx.fi"
  	},
  	{
  		"prefix": 11330,
  		"network": "cess-testnet",
  		"displayName": "CESS Testnet",
  		"symbols": [
  			"TCESS"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://cess.cloud"
  	},
  	{
  		"prefix": 11331,
  		"network": "cess",
  		"displayName": "CESS",
  		"symbols": [
  			"CESS"
  		],
  		"decimals": [
  			12
  		],
  		"standardAccount": "*25519",
  		"website": "https://cess.cloud"
  	},
  	{
  		"prefix": 11820,
  		"network": "contextfree",
  		"displayName": "Automata ContextFree",
  		"symbols": [
  			"CTX"
  		],
  		"decimals": [
  			18
  		],
  		"standardAccount": "*25519",
  		"website": "https://ata.network"
  	}
  ];

  const knownGenesis = {
    acala: ['0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c'],
    astar: ['0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6'],
    basilisk: ['0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755'],
    bifrost: ['0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed'],
    centrifuge: ['0x67dddf2673b69e5f875f6f25277495834398eafd67f492e09f3f3345e003d1b5'],
    'dock-mainnet': ['0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9'],
    edgeware: ['0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b'],
    equilibrium: ['0x6f1a800de3daff7f5e037ddf66ab22ce03ab91874debeddb1086f5f7dbd48925'],
    genshiro: ['0x9b8cefc0eb5c568b527998bdd76c184e2b76ae561be76e4667072230217ea243'],
    hydradx: ['0xd2a620c27ec5cbc5621ff9a522689895074f7cca0d08e7134a7804e1a3ba86fc',
    '0x10af6e84234477d84dc572bac0789813b254aa490767ed06fb9591191d1073f9',
    '0x3d75507dd46301767e601265791da1d9cb47b6ebc94e87347b635e5bf58bd047',
    '0x0ed32bfcab4a83517fac88f2aa7cbc2f88d3ab93be9a12b6188a036bf8a943c2'
    ],
    karura: ['0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b'],
    kulupu: ['0xf7a99d3cb92853d00d5275c971c132c074636256583fee53b3bbe60d7b8769ba'],
    kusama: ['0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    '0xe3777fa922cafbff200cadeaea1a76bd7898ad5b89f7848999058b50e715f636',
    '0x3fd7b9eb6a00376e5be61f01abb429ffb0b104be05eaff4d458da48fcd425baf'
    ],
    'nodle-chain': ['0xa3d114c2b8d0627c1aa9b134eafcf7d05ca561fdc19fb388bb9457f81809fb23'],
    picasso: ['0xe8e7f0f4c4f5a00720b4821dbfddefea7490bcf0b19009961cc46957984e2c1c'],
    polkadot: ['0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'],
    polymesh: ['0x6fbd74e5e1d0a61d52ccfe9d4adaed16dd3a7caa37c6bc4d0c2fa12e8b2f4063'],
    rococo: ['0xaaf2cd1b74b5f726895921259421b534124726263982522174147046b8827897', '0x037f5f3c8e67b314062025fc886fcd6238ea25a4a9b45dce8d246815c9ebe770', '0xc196f81260cf1686172b47a79cf002120735d7cb0eb1474e8adce56618456fff', '0xf6e9983c37baf68846fedafe21e56718790e39fb1c582abc408b81bc7b208f9a', '0x5fce687da39305dfe682b117f0820b319348e8bb37eb16cf34acbf6a202de9d9', '0xe7c3d5edde7db964317cd9b51a3a059d7cd99f81bdbce14990047354334c9779', '0x1611e1dbf0405379b861e2e27daa90f480b2e6d3682414a80835a52e8cb8a215', '0x343442f12fa715489a8714e79a7b264ea88c0d5b8c66b684a7788a516032f6b9', '0x78bcd530c6b3a068bc17473cf5d2aff9c287102bed9af3ae3c41c33b9d6c6147', '0x47381ee0697153d64404fc578392c8fd5cba9073391908f46c888498415647bd', '0x19c0e4fa8ab75f5ac7865e0b8f74ff91eb9a100d336f423cd013a8befba40299'],
    sora: ['0x7e4e32d0feafd4f9c9414b0be86373f9a1efa904809b683453a9af6856d38ad5'],
    stafi: ['0x290a4149f09ea0e402c74c1c7e96ae4239588577fe78932f94f5404c68243d80'],
    statemine: ['0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a'],
    subsocial: ['0x0bd72c1c305172e1275278aaeb3f161e02eccb7a819e63f62d47bd53a28189f8']
  };

  const knownIcon = {
    centrifuge: 'polkadot',
    kusama: 'polkadot',
    polkadot: 'polkadot',
    sora: 'polkadot',
    statemine: 'polkadot',
    statemint: 'polkadot',
    westmint: 'polkadot'
  };
  const knownLedger = {
    bifrost: 0x00000314,
    centrifuge: 0x000002eb,
    'dock-mainnet': 0x00000252,
    edgeware: 0x0000020b,
    equilibrium: 0x05f5e0fd,
    genshiro: 0x05f5e0fc,
    kusama: 0x000001b2,
    'nodle-chain': 0x000003eb,
    polkadot: 0x00000162,
    polymesh: 0x00000253,
    sora: 0x00000269,
    statemine: 0x000001b2
  };
  const knownTestnet = {
    '': true,
    'cess-testnet': true,
    'dock-testnet': true,
    jupiter: true,
    'mathchain-testnet': true,
    subspace_testnet: true,
    'zero-alphaville': true
  };

  const UNSORTED = [0, 2, 42];
  const TESTNETS = ['testnet'];
  function toExpanded(o) {
    const network = o.network || '';
    const nameParts = network.replace(/_/g, '-').split('-');
    const n = o;
    n.slip44 = knownLedger[network];
    n.hasLedgerSupport = !!n.slip44;
    n.genesisHash = knownGenesis[network] || [];
    n.icon = knownIcon[network] || 'substrate';
    n.isTestnet = !!knownTestnet[network] || TESTNETS.includes(nameParts[nameParts.length - 1]);
    n.isIgnored = n.isTestnet || !(o.standardAccount && o.decimals && o.decimals.length && o.symbols && o.symbols.length) && o.prefix !== 42;
    return n;
  }
  function filterSelectable({
    genesisHash,
    prefix
  }) {
    return !!genesisHash.length || prefix === 42;
  }
  function filterAvailable(n) {
    return !n.isIgnored && !!n.network;
  }
  function sortNetworks(a, b) {
    const isUnSortedA = UNSORTED.includes(a.prefix);
    const isUnSortedB = UNSORTED.includes(b.prefix);
    return isUnSortedA === isUnSortedB ? isUnSortedA ? 0 : a.displayName.localeCompare(b.displayName) : isUnSortedA ? -1 : 1;
  }
  const allNetworks = knownSubstrate.map(toExpanded);
  const availableNetworks = allNetworks.filter(filterAvailable).sort(sortNetworks);
  const selectableNetworks = availableNetworks.filter(filterSelectable);

  function networkToPrefix({
    prefix
  }) {
    return prefix;
  }
  const defaults = {
    allowedDecodedLengths: [1, 2, 4, 8, 32, 33],
    allowedEncodedLengths: [3, 4, 6, 10, 35, 36, 37, 38],
    allowedPrefix: availableNetworks.map(networkToPrefix),
    prefix: 42
  };

  function decodeAddress(encoded, ignoreChecksum, ss58Format = -1) {
    util.assert(encoded, 'Invalid empty address passed');
    if (util.isU8a(encoded) || util.isHex(encoded)) {
      return util.u8aToU8a(encoded);
    }
    try {
      const decoded = base58Decode(encoded);
      util.assert(defaults.allowedEncodedLengths.includes(decoded.length), 'Invalid decoded address length');
      const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded);
      util.assert(ignoreChecksum || isValid, 'Invalid decoded address checksum');
      util.assert([-1, ss58Decoded].includes(ss58Format), () => `Expected ss58Format ${ss58Format}, received ${ss58Decoded}`);
      return decoded.slice(ss58Length, endPos);
    } catch (error) {
      throw new Error(`Decoding ${encoded}: ${error.message}`);
    }
  }

  function addressToEvm(address, ignoreChecksum) {
    const decoded = decodeAddress(address, ignoreChecksum);
    return decoded.subarray(0, 20);
  }

  function checkAddress(address, prefix) {
    let decoded;
    try {
      decoded = base58Decode(address);
    } catch (error) {
      return [false, error.message];
    }
    const [isValid,,, ss58Decoded] = checkAddressChecksum(decoded);
    if (ss58Decoded !== prefix) {
      return [false, `Prefix mismatch, expected ${prefix}, found ${ss58Decoded}`];
    } else if (!defaults.allowedEncodedLengths.includes(decoded.length)) {
      return [false, 'Invalid decoded address length'];
    }
    return [isValid, isValid ? null : 'Invalid decoded address checksum'];
  }

  const BN_BE_OPTS = {
    isLe: false
  };
  const BN_LE_OPTS = {
    isLe: true
  };
  const BN_LE_16_OPTS = {
    bitLength: 16,
    isLe: true
  };
  const BN_BE_32_OPTS = {
    bitLength: 32,
    isLe: false
  };
  const BN_LE_32_OPTS = {
    bitLength: 32,
    isLe: true
  };
  const BN_BE_256_OPTS = {
    bitLength: 256,
    isLe: false
  };
  const BN_LE_256_OPTS = {
    bitLength: 256,
    isLe: true
  };
  const BN_LE_512_OPTS = {
    bitLength: 512,
    isLe: true
  };

  function addressToU8a(who) {
    return decodeAddress(who);
  }

  const PREFIX$1 = util.stringToU8a('modlpy/utilisuba');
  function createKeyMulti(who, threshold) {
    return blake2AsU8a(util.u8aConcat(PREFIX$1, util.compactToU8a(who.length), ...util.u8aSorted(who.map(addressToU8a)), util.bnToU8a(threshold, BN_LE_16_OPTS)));
  }

  const PREFIX = util.stringToU8a('modlpy/utilisuba');
  function createKeyDerived(who, index) {
    return blake2AsU8a(util.u8aConcat(PREFIX, decodeAddress(who), util.bnToU8a(index, BN_LE_16_OPTS)));
  }

  const RE_NUMBER = /^\d+$/;
  const JUNCTION_ID_LEN = 32;
  class DeriveJunction {
    #chainCode = new Uint8Array(32);
    #isHard = false;
    static from(value) {
      const result = new DeriveJunction();
      const [code, isHard] = value.startsWith('/') ? [value.substr(1), true] : [value, false];
      result.soft(RE_NUMBER.test(code) ? new util.BN(code, 10) : code);
      return isHard ? result.harden() : result;
    }
    get chainCode() {
      return this.#chainCode;
    }
    get isHard() {
      return this.#isHard;
    }
    get isSoft() {
      return !this.#isHard;
    }
    hard(value) {
      return this.soft(value).harden();
    }
    harden() {
      this.#isHard = true;
      return this;
    }
    soft(value) {
      if (util.isNumber(value) || util.isBn(value) || util.isBigInt(value)) {
        return this.soft(util.bnToU8a(value, BN_LE_256_OPTS));
      } else if (util.isHex(value)) {
        return this.soft(util.hexToU8a(value));
      } else if (util.isString(value)) {
        return this.soft(util.compactAddLength(util.stringToU8a(value)));
      } else if (value.length > JUNCTION_ID_LEN) {
        return this.soft(blake2AsU8a(value));
      }
      this.#chainCode.fill(0);
      this.#chainCode.set(value, 0);
      return this;
    }
    soften() {
      this.#isHard = false;
      return this;
    }
  }

  const RE_JUNCTION = /\/(\/?)([^/]+)/g;
  function keyExtractPath(derivePath) {
    const parts = derivePath.match(RE_JUNCTION);
    const path = [];
    let constructed = '';
    if (parts) {
      constructed = parts.join('');
      for (const p of parts) {
        path.push(DeriveJunction.from(p.substr(1)));
      }
    }
    util.assert(constructed === derivePath, () => `Re-constructed path "${constructed}" does not match input`);
    return {
      parts,
      path
    };
  }

  const RE_CAPTURE = /^(\w+( \w+)*)((\/\/?[^/]+)*)(\/\/\/(.*))?$/;
  function keyExtractSuri(suri) {
    const matches = suri.match(RE_CAPTURE);
    util.assert(!util.isNull(matches), 'Unable to match provided value to a secret URI');
    const [, phrase,, derivePath,,, password] = matches;
    const {
      path
    } = keyExtractPath(derivePath);
    return {
      derivePath,
      password,
      path,
      phrase
    };
  }

  const HDKD$1 = util.compactAddLength(util.stringToU8a('Secp256k1HDKD'));
  function secp256k1DeriveHard(seed, chainCode) {
    util.assert(util.isU8a(chainCode) && chainCode.length === 32, 'Invalid chainCode passed to derive');
    return blake2AsU8a(util.u8aConcat(HDKD$1, seed, chainCode), 256);
  }

  function secp256k1PairFromSeed(seed, onlyJs) {
    util.assert(seed.length === 32, 'Expected valid 32-byte private key as a seed');
    if (!util.hasBigInt || !onlyJs && isReady()) {
      const full = secp256k1FromSeed(seed);
      return {
        publicKey: full.slice(32),
        secretKey: full.slice(0, 32)
      };
    }
    return {
      publicKey: getPublicKey(seed, true),
      secretKey: seed
    };
  }

  function createSeedDeriveFn(fromSeed, derive) {
    return (keypair, {
      chainCode,
      isHard
    }) => {
      util.assert(isHard, 'A soft key was found in the path and is not supported');
      return fromSeed(derive(keypair.secretKey.subarray(0, 32), chainCode));
    };
  }

  const keyHdkdEcdsa = createSeedDeriveFn(secp256k1PairFromSeed, secp256k1DeriveHard);

  var ed2curve$1 = {exports: {}};

  var naclFast = {exports: {}};

  const require$$0 = /*@__PURE__*/getAugmentedNamespace(crypto$1);

  (function (module) {
  (function(nacl) {
  var gf = function(init) {
    var i, r = new Float64Array(16);
    if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
    return r;
  };
  var randombytes = function() { throw new Error('no PRNG'); };
  var _0 = new Uint8Array(16);
  var _9 = new Uint8Array(32); _9[0] = 9;
  var gf0 = gf(),
      gf1 = gf([1]),
      _121665 = gf([0xdb41, 1]),
      D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
      D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]),
      X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]),
      Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]),
      I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);
  function ts64(x, i, h, l) {
    x[i]   = (h >> 24) & 0xff;
    x[i+1] = (h >> 16) & 0xff;
    x[i+2] = (h >>  8) & 0xff;
    x[i+3] = h & 0xff;
    x[i+4] = (l >> 24)  & 0xff;
    x[i+5] = (l >> 16)  & 0xff;
    x[i+6] = (l >>  8)  & 0xff;
    x[i+7] = l & 0xff;
  }
  function vn(x, xi, y, yi, n) {
    var i,d = 0;
    for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
    return (1 & ((d - 1) >>> 8)) - 1;
  }
  function crypto_verify_16(x, xi, y, yi) {
    return vn(x,xi,y,yi,16);
  }
  function crypto_verify_32(x, xi, y, yi) {
    return vn(x,xi,y,yi,32);
  }
  function core_salsa20(o, p, k, c) {
    var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
        j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
        j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
        j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
        j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
        j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
        j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
        j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
        j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
        j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
        j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
        j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
        j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
        j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
        j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
        j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;
    var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
        x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
        x15 = j15, u;
    for (var i = 0; i < 20; i += 2) {
      u = x0 + x12 | 0;
      x4 ^= u<<7 | u>>>(32-7);
      u = x4 + x0 | 0;
      x8 ^= u<<9 | u>>>(32-9);
      u = x8 + x4 | 0;
      x12 ^= u<<13 | u>>>(32-13);
      u = x12 + x8 | 0;
      x0 ^= u<<18 | u>>>(32-18);
      u = x5 + x1 | 0;
      x9 ^= u<<7 | u>>>(32-7);
      u = x9 + x5 | 0;
      x13 ^= u<<9 | u>>>(32-9);
      u = x13 + x9 | 0;
      x1 ^= u<<13 | u>>>(32-13);
      u = x1 + x13 | 0;
      x5 ^= u<<18 | u>>>(32-18);
      u = x10 + x6 | 0;
      x14 ^= u<<7 | u>>>(32-7);
      u = x14 + x10 | 0;
      x2 ^= u<<9 | u>>>(32-9);
      u = x2 + x14 | 0;
      x6 ^= u<<13 | u>>>(32-13);
      u = x6 + x2 | 0;
      x10 ^= u<<18 | u>>>(32-18);
      u = x15 + x11 | 0;
      x3 ^= u<<7 | u>>>(32-7);
      u = x3 + x15 | 0;
      x7 ^= u<<9 | u>>>(32-9);
      u = x7 + x3 | 0;
      x11 ^= u<<13 | u>>>(32-13);
      u = x11 + x7 | 0;
      x15 ^= u<<18 | u>>>(32-18);
      u = x0 + x3 | 0;
      x1 ^= u<<7 | u>>>(32-7);
      u = x1 + x0 | 0;
      x2 ^= u<<9 | u>>>(32-9);
      u = x2 + x1 | 0;
      x3 ^= u<<13 | u>>>(32-13);
      u = x3 + x2 | 0;
      x0 ^= u<<18 | u>>>(32-18);
      u = x5 + x4 | 0;
      x6 ^= u<<7 | u>>>(32-7);
      u = x6 + x5 | 0;
      x7 ^= u<<9 | u>>>(32-9);
      u = x7 + x6 | 0;
      x4 ^= u<<13 | u>>>(32-13);
      u = x4 + x7 | 0;
      x5 ^= u<<18 | u>>>(32-18);
      u = x10 + x9 | 0;
      x11 ^= u<<7 | u>>>(32-7);
      u = x11 + x10 | 0;
      x8 ^= u<<9 | u>>>(32-9);
      u = x8 + x11 | 0;
      x9 ^= u<<13 | u>>>(32-13);
      u = x9 + x8 | 0;
      x10 ^= u<<18 | u>>>(32-18);
      u = x15 + x14 | 0;
      x12 ^= u<<7 | u>>>(32-7);
      u = x12 + x15 | 0;
      x13 ^= u<<9 | u>>>(32-9);
      u = x13 + x12 | 0;
      x14 ^= u<<13 | u>>>(32-13);
      u = x14 + x13 | 0;
      x15 ^= u<<18 | u>>>(32-18);
    }
     x0 =  x0 +  j0 | 0;
     x1 =  x1 +  j1 | 0;
     x2 =  x2 +  j2 | 0;
     x3 =  x3 +  j3 | 0;
     x4 =  x4 +  j4 | 0;
     x5 =  x5 +  j5 | 0;
     x6 =  x6 +  j6 | 0;
     x7 =  x7 +  j7 | 0;
     x8 =  x8 +  j8 | 0;
     x9 =  x9 +  j9 | 0;
    x10 = x10 + j10 | 0;
    x11 = x11 + j11 | 0;
    x12 = x12 + j12 | 0;
    x13 = x13 + j13 | 0;
    x14 = x14 + j14 | 0;
    x15 = x15 + j15 | 0;
    o[ 0] = x0 >>>  0 & 0xff;
    o[ 1] = x0 >>>  8 & 0xff;
    o[ 2] = x0 >>> 16 & 0xff;
    o[ 3] = x0 >>> 24 & 0xff;
    o[ 4] = x1 >>>  0 & 0xff;
    o[ 5] = x1 >>>  8 & 0xff;
    o[ 6] = x1 >>> 16 & 0xff;
    o[ 7] = x1 >>> 24 & 0xff;
    o[ 8] = x2 >>>  0 & 0xff;
    o[ 9] = x2 >>>  8 & 0xff;
    o[10] = x2 >>> 16 & 0xff;
    o[11] = x2 >>> 24 & 0xff;
    o[12] = x3 >>>  0 & 0xff;
    o[13] = x3 >>>  8 & 0xff;
    o[14] = x3 >>> 16 & 0xff;
    o[15] = x3 >>> 24 & 0xff;
    o[16] = x4 >>>  0 & 0xff;
    o[17] = x4 >>>  8 & 0xff;
    o[18] = x4 >>> 16 & 0xff;
    o[19] = x4 >>> 24 & 0xff;
    o[20] = x5 >>>  0 & 0xff;
    o[21] = x5 >>>  8 & 0xff;
    o[22] = x5 >>> 16 & 0xff;
    o[23] = x5 >>> 24 & 0xff;
    o[24] = x6 >>>  0 & 0xff;
    o[25] = x6 >>>  8 & 0xff;
    o[26] = x6 >>> 16 & 0xff;
    o[27] = x6 >>> 24 & 0xff;
    o[28] = x7 >>>  0 & 0xff;
    o[29] = x7 >>>  8 & 0xff;
    o[30] = x7 >>> 16 & 0xff;
    o[31] = x7 >>> 24 & 0xff;
    o[32] = x8 >>>  0 & 0xff;
    o[33] = x8 >>>  8 & 0xff;
    o[34] = x8 >>> 16 & 0xff;
    o[35] = x8 >>> 24 & 0xff;
    o[36] = x9 >>>  0 & 0xff;
    o[37] = x9 >>>  8 & 0xff;
    o[38] = x9 >>> 16 & 0xff;
    o[39] = x9 >>> 24 & 0xff;
    o[40] = x10 >>>  0 & 0xff;
    o[41] = x10 >>>  8 & 0xff;
    o[42] = x10 >>> 16 & 0xff;
    o[43] = x10 >>> 24 & 0xff;
    o[44] = x11 >>>  0 & 0xff;
    o[45] = x11 >>>  8 & 0xff;
    o[46] = x11 >>> 16 & 0xff;
    o[47] = x11 >>> 24 & 0xff;
    o[48] = x12 >>>  0 & 0xff;
    o[49] = x12 >>>  8 & 0xff;
    o[50] = x12 >>> 16 & 0xff;
    o[51] = x12 >>> 24 & 0xff;
    o[52] = x13 >>>  0 & 0xff;
    o[53] = x13 >>>  8 & 0xff;
    o[54] = x13 >>> 16 & 0xff;
    o[55] = x13 >>> 24 & 0xff;
    o[56] = x14 >>>  0 & 0xff;
    o[57] = x14 >>>  8 & 0xff;
    o[58] = x14 >>> 16 & 0xff;
    o[59] = x14 >>> 24 & 0xff;
    o[60] = x15 >>>  0 & 0xff;
    o[61] = x15 >>>  8 & 0xff;
    o[62] = x15 >>> 16 & 0xff;
    o[63] = x15 >>> 24 & 0xff;
  }
  function core_hsalsa20(o,p,k,c) {
    var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
        j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
        j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
        j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
        j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
        j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
        j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
        j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
        j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
        j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
        j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
        j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
        j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
        j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
        j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
        j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;
    var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
        x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
        x15 = j15, u;
    for (var i = 0; i < 20; i += 2) {
      u = x0 + x12 | 0;
      x4 ^= u<<7 | u>>>(32-7);
      u = x4 + x0 | 0;
      x8 ^= u<<9 | u>>>(32-9);
      u = x8 + x4 | 0;
      x12 ^= u<<13 | u>>>(32-13);
      u = x12 + x8 | 0;
      x0 ^= u<<18 | u>>>(32-18);
      u = x5 + x1 | 0;
      x9 ^= u<<7 | u>>>(32-7);
      u = x9 + x5 | 0;
      x13 ^= u<<9 | u>>>(32-9);
      u = x13 + x9 | 0;
      x1 ^= u<<13 | u>>>(32-13);
      u = x1 + x13 | 0;
      x5 ^= u<<18 | u>>>(32-18);
      u = x10 + x6 | 0;
      x14 ^= u<<7 | u>>>(32-7);
      u = x14 + x10 | 0;
      x2 ^= u<<9 | u>>>(32-9);
      u = x2 + x14 | 0;
      x6 ^= u<<13 | u>>>(32-13);
      u = x6 + x2 | 0;
      x10 ^= u<<18 | u>>>(32-18);
      u = x15 + x11 | 0;
      x3 ^= u<<7 | u>>>(32-7);
      u = x3 + x15 | 0;
      x7 ^= u<<9 | u>>>(32-9);
      u = x7 + x3 | 0;
      x11 ^= u<<13 | u>>>(32-13);
      u = x11 + x7 | 0;
      x15 ^= u<<18 | u>>>(32-18);
      u = x0 + x3 | 0;
      x1 ^= u<<7 | u>>>(32-7);
      u = x1 + x0 | 0;
      x2 ^= u<<9 | u>>>(32-9);
      u = x2 + x1 | 0;
      x3 ^= u<<13 | u>>>(32-13);
      u = x3 + x2 | 0;
      x0 ^= u<<18 | u>>>(32-18);
      u = x5 + x4 | 0;
      x6 ^= u<<7 | u>>>(32-7);
      u = x6 + x5 | 0;
      x7 ^= u<<9 | u>>>(32-9);
      u = x7 + x6 | 0;
      x4 ^= u<<13 | u>>>(32-13);
      u = x4 + x7 | 0;
      x5 ^= u<<18 | u>>>(32-18);
      u = x10 + x9 | 0;
      x11 ^= u<<7 | u>>>(32-7);
      u = x11 + x10 | 0;
      x8 ^= u<<9 | u>>>(32-9);
      u = x8 + x11 | 0;
      x9 ^= u<<13 | u>>>(32-13);
      u = x9 + x8 | 0;
      x10 ^= u<<18 | u>>>(32-18);
      u = x15 + x14 | 0;
      x12 ^= u<<7 | u>>>(32-7);
      u = x12 + x15 | 0;
      x13 ^= u<<9 | u>>>(32-9);
      u = x13 + x12 | 0;
      x14 ^= u<<13 | u>>>(32-13);
      u = x14 + x13 | 0;
      x15 ^= u<<18 | u>>>(32-18);
    }
    o[ 0] = x0 >>>  0 & 0xff;
    o[ 1] = x0 >>>  8 & 0xff;
    o[ 2] = x0 >>> 16 & 0xff;
    o[ 3] = x0 >>> 24 & 0xff;
    o[ 4] = x5 >>>  0 & 0xff;
    o[ 5] = x5 >>>  8 & 0xff;
    o[ 6] = x5 >>> 16 & 0xff;
    o[ 7] = x5 >>> 24 & 0xff;
    o[ 8] = x10 >>>  0 & 0xff;
    o[ 9] = x10 >>>  8 & 0xff;
    o[10] = x10 >>> 16 & 0xff;
    o[11] = x10 >>> 24 & 0xff;
    o[12] = x15 >>>  0 & 0xff;
    o[13] = x15 >>>  8 & 0xff;
    o[14] = x15 >>> 16 & 0xff;
    o[15] = x15 >>> 24 & 0xff;
    o[16] = x6 >>>  0 & 0xff;
    o[17] = x6 >>>  8 & 0xff;
    o[18] = x6 >>> 16 & 0xff;
    o[19] = x6 >>> 24 & 0xff;
    o[20] = x7 >>>  0 & 0xff;
    o[21] = x7 >>>  8 & 0xff;
    o[22] = x7 >>> 16 & 0xff;
    o[23] = x7 >>> 24 & 0xff;
    o[24] = x8 >>>  0 & 0xff;
    o[25] = x8 >>>  8 & 0xff;
    o[26] = x8 >>> 16 & 0xff;
    o[27] = x8 >>> 24 & 0xff;
    o[28] = x9 >>>  0 & 0xff;
    o[29] = x9 >>>  8 & 0xff;
    o[30] = x9 >>> 16 & 0xff;
    o[31] = x9 >>> 24 & 0xff;
  }
  function crypto_core_salsa20(out,inp,k,c) {
    core_salsa20(out,inp,k,c);
  }
  function crypto_core_hsalsa20(out,inp,k,c) {
    core_hsalsa20(out,inp,k,c);
  }
  var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
  function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
    var z = new Uint8Array(16), x = new Uint8Array(64);
    var u, i;
    for (i = 0; i < 16; i++) z[i] = 0;
    for (i = 0; i < 8; i++) z[i] = n[i];
    while (b >= 64) {
      crypto_core_salsa20(x,z,k,sigma);
      for (i = 0; i < 64; i++) c[cpos+i] = m[mpos+i] ^ x[i];
      u = 1;
      for (i = 8; i < 16; i++) {
        u = u + (z[i] & 0xff) | 0;
        z[i] = u & 0xff;
        u >>>= 8;
      }
      b -= 64;
      cpos += 64;
      mpos += 64;
    }
    if (b > 0) {
      crypto_core_salsa20(x,z,k,sigma);
      for (i = 0; i < b; i++) c[cpos+i] = m[mpos+i] ^ x[i];
    }
    return 0;
  }
  function crypto_stream_salsa20(c,cpos,b,n,k) {
    var z = new Uint8Array(16), x = new Uint8Array(64);
    var u, i;
    for (i = 0; i < 16; i++) z[i] = 0;
    for (i = 0; i < 8; i++) z[i] = n[i];
    while (b >= 64) {
      crypto_core_salsa20(x,z,k,sigma);
      for (i = 0; i < 64; i++) c[cpos+i] = x[i];
      u = 1;
      for (i = 8; i < 16; i++) {
        u = u + (z[i] & 0xff) | 0;
        z[i] = u & 0xff;
        u >>>= 8;
      }
      b -= 64;
      cpos += 64;
    }
    if (b > 0) {
      crypto_core_salsa20(x,z,k,sigma);
      for (i = 0; i < b; i++) c[cpos+i] = x[i];
    }
    return 0;
  }
  function crypto_stream(c,cpos,d,n,k) {
    var s = new Uint8Array(32);
    crypto_core_hsalsa20(s,n,k,sigma);
    var sn = new Uint8Array(8);
    for (var i = 0; i < 8; i++) sn[i] = n[i+16];
    return crypto_stream_salsa20(c,cpos,d,sn,s);
  }
  function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
    var s = new Uint8Array(32);
    crypto_core_hsalsa20(s,n,k,sigma);
    var sn = new Uint8Array(8);
    for (var i = 0; i < 8; i++) sn[i] = n[i+16];
    return crypto_stream_salsa20_xor(c,cpos,m,mpos,d,sn,s);
  }
  var poly1305 = function(key) {
    this.buffer = new Uint8Array(16);
    this.r = new Uint16Array(10);
    this.h = new Uint16Array(10);
    this.pad = new Uint16Array(8);
    this.leftover = 0;
    this.fin = 0;
    var t0, t1, t2, t3, t4, t5, t6, t7;
    t0 = key[ 0] & 0xff | (key[ 1] & 0xff) << 8; this.r[0] = ( t0                     ) & 0x1fff;
    t1 = key[ 2] & 0xff | (key[ 3] & 0xff) << 8; this.r[1] = ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
    t2 = key[ 4] & 0xff | (key[ 5] & 0xff) << 8; this.r[2] = ((t1 >>> 10) | (t2 <<  6)) & 0x1f03;
    t3 = key[ 6] & 0xff | (key[ 7] & 0xff) << 8; this.r[3] = ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
    t4 = key[ 8] & 0xff | (key[ 9] & 0xff) << 8; this.r[4] = ((t3 >>>  4) | (t4 << 12)) & 0x00ff;
    this.r[5] = ((t4 >>>  1)) & 0x1ffe;
    t5 = key[10] & 0xff | (key[11] & 0xff) << 8; this.r[6] = ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
    t6 = key[12] & 0xff | (key[13] & 0xff) << 8; this.r[7] = ((t5 >>> 11) | (t6 <<  5)) & 0x1f81;
    t7 = key[14] & 0xff | (key[15] & 0xff) << 8; this.r[8] = ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
    this.r[9] = ((t7 >>>  5)) & 0x007f;
    this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
    this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
    this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
    this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
    this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
    this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
    this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
    this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
  };
  poly1305.prototype.blocks = function(m, mpos, bytes) {
    var hibit = this.fin ? 0 : (1 << 11);
    var t0, t1, t2, t3, t4, t5, t6, t7, c;
    var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
    var h0 = this.h[0],
        h1 = this.h[1],
        h2 = this.h[2],
        h3 = this.h[3],
        h4 = this.h[4],
        h5 = this.h[5],
        h6 = this.h[6],
        h7 = this.h[7],
        h8 = this.h[8],
        h9 = this.h[9];
    var r0 = this.r[0],
        r1 = this.r[1],
        r2 = this.r[2],
        r3 = this.r[3],
        r4 = this.r[4],
        r5 = this.r[5],
        r6 = this.r[6],
        r7 = this.r[7],
        r8 = this.r[8],
        r9 = this.r[9];
    while (bytes >= 16) {
      t0 = m[mpos+ 0] & 0xff | (m[mpos+ 1] & 0xff) << 8; h0 += ( t0                     ) & 0x1fff;
      t1 = m[mpos+ 2] & 0xff | (m[mpos+ 3] & 0xff) << 8; h1 += ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
      t2 = m[mpos+ 4] & 0xff | (m[mpos+ 5] & 0xff) << 8; h2 += ((t1 >>> 10) | (t2 <<  6)) & 0x1fff;
      t3 = m[mpos+ 6] & 0xff | (m[mpos+ 7] & 0xff) << 8; h3 += ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
      t4 = m[mpos+ 8] & 0xff | (m[mpos+ 9] & 0xff) << 8; h4 += ((t3 >>>  4) | (t4 << 12)) & 0x1fff;
      h5 += ((t4 >>>  1)) & 0x1fff;
      t5 = m[mpos+10] & 0xff | (m[mpos+11] & 0xff) << 8; h6 += ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
      t6 = m[mpos+12] & 0xff | (m[mpos+13] & 0xff) << 8; h7 += ((t5 >>> 11) | (t6 <<  5)) & 0x1fff;
      t7 = m[mpos+14] & 0xff | (m[mpos+15] & 0xff) << 8; h8 += ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
      h9 += ((t7 >>> 5)) | hibit;
      c = 0;
      d0 = c;
      d0 += h0 * r0;
      d0 += h1 * (5 * r9);
      d0 += h2 * (5 * r8);
      d0 += h3 * (5 * r7);
      d0 += h4 * (5 * r6);
      c = (d0 >>> 13); d0 &= 0x1fff;
      d0 += h5 * (5 * r5);
      d0 += h6 * (5 * r4);
      d0 += h7 * (5 * r3);
      d0 += h8 * (5 * r2);
      d0 += h9 * (5 * r1);
      c += (d0 >>> 13); d0 &= 0x1fff;
      d1 = c;
      d1 += h0 * r1;
      d1 += h1 * r0;
      d1 += h2 * (5 * r9);
      d1 += h3 * (5 * r8);
      d1 += h4 * (5 * r7);
      c = (d1 >>> 13); d1 &= 0x1fff;
      d1 += h5 * (5 * r6);
      d1 += h6 * (5 * r5);
      d1 += h7 * (5 * r4);
      d1 += h8 * (5 * r3);
      d1 += h9 * (5 * r2);
      c += (d1 >>> 13); d1 &= 0x1fff;
      d2 = c;
      d2 += h0 * r2;
      d2 += h1 * r1;
      d2 += h2 * r0;
      d2 += h3 * (5 * r9);
      d2 += h4 * (5 * r8);
      c = (d2 >>> 13); d2 &= 0x1fff;
      d2 += h5 * (5 * r7);
      d2 += h6 * (5 * r6);
      d2 += h7 * (5 * r5);
      d2 += h8 * (5 * r4);
      d2 += h9 * (5 * r3);
      c += (d2 >>> 13); d2 &= 0x1fff;
      d3 = c;
      d3 += h0 * r3;
      d3 += h1 * r2;
      d3 += h2 * r1;
      d3 += h3 * r0;
      d3 += h4 * (5 * r9);
      c = (d3 >>> 13); d3 &= 0x1fff;
      d3 += h5 * (5 * r8);
      d3 += h6 * (5 * r7);
      d3 += h7 * (5 * r6);
      d3 += h8 * (5 * r5);
      d3 += h9 * (5 * r4);
      c += (d3 >>> 13); d3 &= 0x1fff;
      d4 = c;
      d4 += h0 * r4;
      d4 += h1 * r3;
      d4 += h2 * r2;
      d4 += h3 * r1;
      d4 += h4 * r0;
      c = (d4 >>> 13); d4 &= 0x1fff;
      d4 += h5 * (5 * r9);
      d4 += h6 * (5 * r8);
      d4 += h7 * (5 * r7);
      d4 += h8 * (5 * r6);
      d4 += h9 * (5 * r5);
      c += (d4 >>> 13); d4 &= 0x1fff;
      d5 = c;
      d5 += h0 * r5;
      d5 += h1 * r4;
      d5 += h2 * r3;
      d5 += h3 * r2;
      d5 += h4 * r1;
      c = (d5 >>> 13); d5 &= 0x1fff;
      d5 += h5 * r0;
      d5 += h6 * (5 * r9);
      d5 += h7 * (5 * r8);
      d5 += h8 * (5 * r7);
      d5 += h9 * (5 * r6);
      c += (d5 >>> 13); d5 &= 0x1fff;
      d6 = c;
      d6 += h0 * r6;
      d6 += h1 * r5;
      d6 += h2 * r4;
      d6 += h3 * r3;
      d6 += h4 * r2;
      c = (d6 >>> 13); d6 &= 0x1fff;
      d6 += h5 * r1;
      d6 += h6 * r0;
      d6 += h7 * (5 * r9);
      d6 += h8 * (5 * r8);
      d6 += h9 * (5 * r7);
      c += (d6 >>> 13); d6 &= 0x1fff;
      d7 = c;
      d7 += h0 * r7;
      d7 += h1 * r6;
      d7 += h2 * r5;
      d7 += h3 * r4;
      d7 += h4 * r3;
      c = (d7 >>> 13); d7 &= 0x1fff;
      d7 += h5 * r2;
      d7 += h6 * r1;
      d7 += h7 * r0;
      d7 += h8 * (5 * r9);
      d7 += h9 * (5 * r8);
      c += (d7 >>> 13); d7 &= 0x1fff;
      d8 = c;
      d8 += h0 * r8;
      d8 += h1 * r7;
      d8 += h2 * r6;
      d8 += h3 * r5;
      d8 += h4 * r4;
      c = (d8 >>> 13); d8 &= 0x1fff;
      d8 += h5 * r3;
      d8 += h6 * r2;
      d8 += h7 * r1;
      d8 += h8 * r0;
      d8 += h9 * (5 * r9);
      c += (d8 >>> 13); d8 &= 0x1fff;
      d9 = c;
      d9 += h0 * r9;
      d9 += h1 * r8;
      d9 += h2 * r7;
      d9 += h3 * r6;
      d9 += h4 * r5;
      c = (d9 >>> 13); d9 &= 0x1fff;
      d9 += h5 * r4;
      d9 += h6 * r3;
      d9 += h7 * r2;
      d9 += h8 * r1;
      d9 += h9 * r0;
      c += (d9 >>> 13); d9 &= 0x1fff;
      c = (((c << 2) + c)) | 0;
      c = (c + d0) | 0;
      d0 = c & 0x1fff;
      c = (c >>> 13);
      d1 += c;
      h0 = d0;
      h1 = d1;
      h2 = d2;
      h3 = d3;
      h4 = d4;
      h5 = d5;
      h6 = d6;
      h7 = d7;
      h8 = d8;
      h9 = d9;
      mpos += 16;
      bytes -= 16;
    }
    this.h[0] = h0;
    this.h[1] = h1;
    this.h[2] = h2;
    this.h[3] = h3;
    this.h[4] = h4;
    this.h[5] = h5;
    this.h[6] = h6;
    this.h[7] = h7;
    this.h[8] = h8;
    this.h[9] = h9;
  };
  poly1305.prototype.finish = function(mac, macpos) {
    var g = new Uint16Array(10);
    var c, mask, f, i;
    if (this.leftover) {
      i = this.leftover;
      this.buffer[i++] = 1;
      for (; i < 16; i++) this.buffer[i] = 0;
      this.fin = 1;
      this.blocks(this.buffer, 0, 16);
    }
    c = this.h[1] >>> 13;
    this.h[1] &= 0x1fff;
    for (i = 2; i < 10; i++) {
      this.h[i] += c;
      c = this.h[i] >>> 13;
      this.h[i] &= 0x1fff;
    }
    this.h[0] += (c * 5);
    c = this.h[0] >>> 13;
    this.h[0] &= 0x1fff;
    this.h[1] += c;
    c = this.h[1] >>> 13;
    this.h[1] &= 0x1fff;
    this.h[2] += c;
    g[0] = this.h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 0x1fff;
    for (i = 1; i < 10; i++) {
      g[i] = this.h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 0x1fff;
    }
    g[9] -= (1 << 13);
    mask = (c ^ 1) - 1;
    for (i = 0; i < 10; i++) g[i] &= mask;
    mask = ~mask;
    for (i = 0; i < 10; i++) this.h[i] = (this.h[i] & mask) | g[i];
    this.h[0] = ((this.h[0]       ) | (this.h[1] << 13)                    ) & 0xffff;
    this.h[1] = ((this.h[1] >>>  3) | (this.h[2] << 10)                    ) & 0xffff;
    this.h[2] = ((this.h[2] >>>  6) | (this.h[3] <<  7)                    ) & 0xffff;
    this.h[3] = ((this.h[3] >>>  9) | (this.h[4] <<  4)                    ) & 0xffff;
    this.h[4] = ((this.h[4] >>> 12) | (this.h[5] <<  1) | (this.h[6] << 14)) & 0xffff;
    this.h[5] = ((this.h[6] >>>  2) | (this.h[7] << 11)                    ) & 0xffff;
    this.h[6] = ((this.h[7] >>>  5) | (this.h[8] <<  8)                    ) & 0xffff;
    this.h[7] = ((this.h[8] >>>  8) | (this.h[9] <<  5)                    ) & 0xffff;
    f = this.h[0] + this.pad[0];
    this.h[0] = f & 0xffff;
    for (i = 1; i < 8; i++) {
      f = (((this.h[i] + this.pad[i]) | 0) + (f >>> 16)) | 0;
      this.h[i] = f & 0xffff;
    }
    mac[macpos+ 0] = (this.h[0] >>> 0) & 0xff;
    mac[macpos+ 1] = (this.h[0] >>> 8) & 0xff;
    mac[macpos+ 2] = (this.h[1] >>> 0) & 0xff;
    mac[macpos+ 3] = (this.h[1] >>> 8) & 0xff;
    mac[macpos+ 4] = (this.h[2] >>> 0) & 0xff;
    mac[macpos+ 5] = (this.h[2] >>> 8) & 0xff;
    mac[macpos+ 6] = (this.h[3] >>> 0) & 0xff;
    mac[macpos+ 7] = (this.h[3] >>> 8) & 0xff;
    mac[macpos+ 8] = (this.h[4] >>> 0) & 0xff;
    mac[macpos+ 9] = (this.h[4] >>> 8) & 0xff;
    mac[macpos+10] = (this.h[5] >>> 0) & 0xff;
    mac[macpos+11] = (this.h[5] >>> 8) & 0xff;
    mac[macpos+12] = (this.h[6] >>> 0) & 0xff;
    mac[macpos+13] = (this.h[6] >>> 8) & 0xff;
    mac[macpos+14] = (this.h[7] >>> 0) & 0xff;
    mac[macpos+15] = (this.h[7] >>> 8) & 0xff;
  };
  poly1305.prototype.update = function(m, mpos, bytes) {
    var i, want;
    if (this.leftover) {
      want = (16 - this.leftover);
      if (want > bytes)
        want = bytes;
      for (i = 0; i < want; i++)
        this.buffer[this.leftover + i] = m[mpos+i];
      bytes -= want;
      mpos += want;
      this.leftover += want;
      if (this.leftover < 16)
        return;
      this.blocks(this.buffer, 0, 16);
      this.leftover = 0;
    }
    if (bytes >= 16) {
      want = bytes - (bytes % 16);
      this.blocks(m, mpos, want);
      mpos += want;
      bytes -= want;
    }
    if (bytes) {
      for (i = 0; i < bytes; i++)
        this.buffer[this.leftover + i] = m[mpos+i];
      this.leftover += bytes;
    }
  };
  function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
    var s = new poly1305(k);
    s.update(m, mpos, n);
    s.finish(out, outpos);
    return 0;
  }
  function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
    var x = new Uint8Array(16);
    crypto_onetimeauth(x,0,m,mpos,n,k);
    return crypto_verify_16(h,hpos,x,0);
  }
  function crypto_secretbox(c,m,d,n,k) {
    var i;
    if (d < 32) return -1;
    crypto_stream_xor(c,0,m,0,d,n,k);
    crypto_onetimeauth(c, 16, c, 32, d - 32, c);
    for (i = 0; i < 16; i++) c[i] = 0;
    return 0;
  }
  function crypto_secretbox_open(m,c,d,n,k) {
    var i;
    var x = new Uint8Array(32);
    if (d < 32) return -1;
    crypto_stream(x,0,32,n,k);
    if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return -1;
    crypto_stream_xor(m,0,c,0,d,n,k);
    for (i = 0; i < 32; i++) m[i] = 0;
    return 0;
  }
  function set25519(r, a) {
    var i;
    for (i = 0; i < 16; i++) r[i] = a[i]|0;
  }
  function car25519(o) {
    var i, v, c = 1;
    for (i = 0; i < 16; i++) {
      v = o[i] + c + 65535;
      c = Math.floor(v / 65536);
      o[i] = v - c * 65536;
    }
    o[0] += c-1 + 37 * (c-1);
  }
  function sel25519(p, q, b) {
    var t, c = ~(b-1);
    for (var i = 0; i < 16; i++) {
      t = c & (p[i] ^ q[i]);
      p[i] ^= t;
      q[i] ^= t;
    }
  }
  function pack25519(o, n) {
    var i, j, b;
    var m = gf(), t = gf();
    for (i = 0; i < 16; i++) t[i] = n[i];
    car25519(t);
    car25519(t);
    car25519(t);
    for (j = 0; j < 2; j++) {
      m[0] = t[0] - 0xffed;
      for (i = 1; i < 15; i++) {
        m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
        m[i-1] &= 0xffff;
      }
      m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
      b = (m[15]>>16) & 1;
      m[14] &= 0xffff;
      sel25519(t, m, 1-b);
    }
    for (i = 0; i < 16; i++) {
      o[2*i] = t[i] & 0xff;
      o[2*i+1] = t[i]>>8;
    }
  }
  function neq25519(a, b) {
    var c = new Uint8Array(32), d = new Uint8Array(32);
    pack25519(c, a);
    pack25519(d, b);
    return crypto_verify_32(c, 0, d, 0);
  }
  function par25519(a) {
    var d = new Uint8Array(32);
    pack25519(d, a);
    return d[0] & 1;
  }
  function unpack25519(o, n) {
    var i;
    for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
    o[15] &= 0x7fff;
  }
  function A(o, a, b) {
    for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
  }
  function Z(o, a, b) {
    for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
  }
  function M(o, a, b) {
    var v, c,
       t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
       t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
      t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
      t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
      b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7],
      b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11],
      b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
    v = a[0];
    t0 += v * b0;
    t1 += v * b1;
    t2 += v * b2;
    t3 += v * b3;
    t4 += v * b4;
    t5 += v * b5;
    t6 += v * b6;
    t7 += v * b7;
    t8 += v * b8;
    t9 += v * b9;
    t10 += v * b10;
    t11 += v * b11;
    t12 += v * b12;
    t13 += v * b13;
    t14 += v * b14;
    t15 += v * b15;
    v = a[1];
    t1 += v * b0;
    t2 += v * b1;
    t3 += v * b2;
    t4 += v * b3;
    t5 += v * b4;
    t6 += v * b5;
    t7 += v * b6;
    t8 += v * b7;
    t9 += v * b8;
    t10 += v * b9;
    t11 += v * b10;
    t12 += v * b11;
    t13 += v * b12;
    t14 += v * b13;
    t15 += v * b14;
    t16 += v * b15;
    v = a[2];
    t2 += v * b0;
    t3 += v * b1;
    t4 += v * b2;
    t5 += v * b3;
    t6 += v * b4;
    t7 += v * b5;
    t8 += v * b6;
    t9 += v * b7;
    t10 += v * b8;
    t11 += v * b9;
    t12 += v * b10;
    t13 += v * b11;
    t14 += v * b12;
    t15 += v * b13;
    t16 += v * b14;
    t17 += v * b15;
    v = a[3];
    t3 += v * b0;
    t4 += v * b1;
    t5 += v * b2;
    t6 += v * b3;
    t7 += v * b4;
    t8 += v * b5;
    t9 += v * b6;
    t10 += v * b7;
    t11 += v * b8;
    t12 += v * b9;
    t13 += v * b10;
    t14 += v * b11;
    t15 += v * b12;
    t16 += v * b13;
    t17 += v * b14;
    t18 += v * b15;
    v = a[4];
    t4 += v * b0;
    t5 += v * b1;
    t6 += v * b2;
    t7 += v * b3;
    t8 += v * b4;
    t9 += v * b5;
    t10 += v * b6;
    t11 += v * b7;
    t12 += v * b8;
    t13 += v * b9;
    t14 += v * b10;
    t15 += v * b11;
    t16 += v * b12;
    t17 += v * b13;
    t18 += v * b14;
    t19 += v * b15;
    v = a[5];
    t5 += v * b0;
    t6 += v * b1;
    t7 += v * b2;
    t8 += v * b3;
    t9 += v * b4;
    t10 += v * b5;
    t11 += v * b6;
    t12 += v * b7;
    t13 += v * b8;
    t14 += v * b9;
    t15 += v * b10;
    t16 += v * b11;
    t17 += v * b12;
    t18 += v * b13;
    t19 += v * b14;
    t20 += v * b15;
    v = a[6];
    t6 += v * b0;
    t7 += v * b1;
    t8 += v * b2;
    t9 += v * b3;
    t10 += v * b4;
    t11 += v * b5;
    t12 += v * b6;
    t13 += v * b7;
    t14 += v * b8;
    t15 += v * b9;
    t16 += v * b10;
    t17 += v * b11;
    t18 += v * b12;
    t19 += v * b13;
    t20 += v * b14;
    t21 += v * b15;
    v = a[7];
    t7 += v * b0;
    t8 += v * b1;
    t9 += v * b2;
    t10 += v * b3;
    t11 += v * b4;
    t12 += v * b5;
    t13 += v * b6;
    t14 += v * b7;
    t15 += v * b8;
    t16 += v * b9;
    t17 += v * b10;
    t18 += v * b11;
    t19 += v * b12;
    t20 += v * b13;
    t21 += v * b14;
    t22 += v * b15;
    v = a[8];
    t8 += v * b0;
    t9 += v * b1;
    t10 += v * b2;
    t11 += v * b3;
    t12 += v * b4;
    t13 += v * b5;
    t14 += v * b6;
    t15 += v * b7;
    t16 += v * b8;
    t17 += v * b9;
    t18 += v * b10;
    t19 += v * b11;
    t20 += v * b12;
    t21 += v * b13;
    t22 += v * b14;
    t23 += v * b15;
    v = a[9];
    t9 += v * b0;
    t10 += v * b1;
    t11 += v * b2;
    t12 += v * b3;
    t13 += v * b4;
    t14 += v * b5;
    t15 += v * b6;
    t16 += v * b7;
    t17 += v * b8;
    t18 += v * b9;
    t19 += v * b10;
    t20 += v * b11;
    t21 += v * b12;
    t22 += v * b13;
    t23 += v * b14;
    t24 += v * b15;
    v = a[10];
    t10 += v * b0;
    t11 += v * b1;
    t12 += v * b2;
    t13 += v * b3;
    t14 += v * b4;
    t15 += v * b5;
    t16 += v * b6;
    t17 += v * b7;
    t18 += v * b8;
    t19 += v * b9;
    t20 += v * b10;
    t21 += v * b11;
    t22 += v * b12;
    t23 += v * b13;
    t24 += v * b14;
    t25 += v * b15;
    v = a[11];
    t11 += v * b0;
    t12 += v * b1;
    t13 += v * b2;
    t14 += v * b3;
    t15 += v * b4;
    t16 += v * b5;
    t17 += v * b6;
    t18 += v * b7;
    t19 += v * b8;
    t20 += v * b9;
    t21 += v * b10;
    t22 += v * b11;
    t23 += v * b12;
    t24 += v * b13;
    t25 += v * b14;
    t26 += v * b15;
    v = a[12];
    t12 += v * b0;
    t13 += v * b1;
    t14 += v * b2;
    t15 += v * b3;
    t16 += v * b4;
    t17 += v * b5;
    t18 += v * b6;
    t19 += v * b7;
    t20 += v * b8;
    t21 += v * b9;
    t22 += v * b10;
    t23 += v * b11;
    t24 += v * b12;
    t25 += v * b13;
    t26 += v * b14;
    t27 += v * b15;
    v = a[13];
    t13 += v * b0;
    t14 += v * b1;
    t15 += v * b2;
    t16 += v * b3;
    t17 += v * b4;
    t18 += v * b5;
    t19 += v * b6;
    t20 += v * b7;
    t21 += v * b8;
    t22 += v * b9;
    t23 += v * b10;
    t24 += v * b11;
    t25 += v * b12;
    t26 += v * b13;
    t27 += v * b14;
    t28 += v * b15;
    v = a[14];
    t14 += v * b0;
    t15 += v * b1;
    t16 += v * b2;
    t17 += v * b3;
    t18 += v * b4;
    t19 += v * b5;
    t20 += v * b6;
    t21 += v * b7;
    t22 += v * b8;
    t23 += v * b9;
    t24 += v * b10;
    t25 += v * b11;
    t26 += v * b12;
    t27 += v * b13;
    t28 += v * b14;
    t29 += v * b15;
    v = a[15];
    t15 += v * b0;
    t16 += v * b1;
    t17 += v * b2;
    t18 += v * b3;
    t19 += v * b4;
    t20 += v * b5;
    t21 += v * b6;
    t22 += v * b7;
    t23 += v * b8;
    t24 += v * b9;
    t25 += v * b10;
    t26 += v * b11;
    t27 += v * b12;
    t28 += v * b13;
    t29 += v * b14;
    t30 += v * b15;
    t0  += 38 * t16;
    t1  += 38 * t17;
    t2  += 38 * t18;
    t3  += 38 * t19;
    t4  += 38 * t20;
    t5  += 38 * t21;
    t6  += 38 * t22;
    t7  += 38 * t23;
    t8  += 38 * t24;
    t9  += 38 * t25;
    t10 += 38 * t26;
    t11 += 38 * t27;
    t12 += 38 * t28;
    t13 += 38 * t29;
    t14 += 38 * t30;
    c = 1;
    v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
    v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
    v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
    v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
    v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
    v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
    v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
    v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
    v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
    v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
    v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
    v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
    v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
    v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
    v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
    v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
    t0 += c-1 + 37 * (c-1);
    c = 1;
    v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
    v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
    v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
    v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
    v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
    v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
    v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
    v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
    v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
    v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
    v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
    v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
    v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
    v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
    v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
    v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
    t0 += c-1 + 37 * (c-1);
    o[ 0] = t0;
    o[ 1] = t1;
    o[ 2] = t2;
    o[ 3] = t3;
    o[ 4] = t4;
    o[ 5] = t5;
    o[ 6] = t6;
    o[ 7] = t7;
    o[ 8] = t8;
    o[ 9] = t9;
    o[10] = t10;
    o[11] = t11;
    o[12] = t12;
    o[13] = t13;
    o[14] = t14;
    o[15] = t15;
  }
  function S(o, a) {
    M(o, a, a);
  }
  function inv25519(o, i) {
    var c = gf();
    var a;
    for (a = 0; a < 16; a++) c[a] = i[a];
    for (a = 253; a >= 0; a--) {
      S(c, c);
      if(a !== 2 && a !== 4) M(c, c, i);
    }
    for (a = 0; a < 16; a++) o[a] = c[a];
  }
  function pow2523(o, i) {
    var c = gf();
    var a;
    for (a = 0; a < 16; a++) c[a] = i[a];
    for (a = 250; a >= 0; a--) {
        S(c, c);
        if(a !== 1) M(c, c, i);
    }
    for (a = 0; a < 16; a++) o[a] = c[a];
  }
  function crypto_scalarmult(q, n, p) {
    var z = new Uint8Array(32);
    var x = new Float64Array(80), r, i;
    var a = gf(), b = gf(), c = gf(),
        d = gf(), e = gf(), f = gf();
    for (i = 0; i < 31; i++) z[i] = n[i];
    z[31]=(n[31]&127)|64;
    z[0]&=248;
    unpack25519(x,p);
    for (i = 0; i < 16; i++) {
      b[i]=x[i];
      d[i]=a[i]=c[i]=0;
    }
    a[0]=d[0]=1;
    for (i=254; i>=0; --i) {
      r=(z[i>>>3]>>>(i&7))&1;
      sel25519(a,b,r);
      sel25519(c,d,r);
      A(e,a,c);
      Z(a,a,c);
      A(c,b,d);
      Z(b,b,d);
      S(d,e);
      S(f,a);
      M(a,c,a);
      M(c,b,e);
      A(e,a,c);
      Z(a,a,c);
      S(b,a);
      Z(c,d,f);
      M(a,c,_121665);
      A(a,a,d);
      M(c,c,a);
      M(a,d,f);
      M(d,b,x);
      S(b,e);
      sel25519(a,b,r);
      sel25519(c,d,r);
    }
    for (i = 0; i < 16; i++) {
      x[i+16]=a[i];
      x[i+32]=c[i];
      x[i+48]=b[i];
      x[i+64]=d[i];
    }
    var x32 = x.subarray(32);
    var x16 = x.subarray(16);
    inv25519(x32,x32);
    M(x16,x16,x32);
    pack25519(q,x16);
    return 0;
  }
  function crypto_scalarmult_base(q, n) {
    return crypto_scalarmult(q, n, _9);
  }
  function crypto_box_keypair(y, x) {
    randombytes(x, 32);
    return crypto_scalarmult_base(y, x);
  }
  function crypto_box_beforenm(k, y, x) {
    var s = new Uint8Array(32);
    crypto_scalarmult(s, x, y);
    return crypto_core_hsalsa20(k, _0, s, sigma);
  }
  var crypto_box_afternm = crypto_secretbox;
  var crypto_box_open_afternm = crypto_secretbox_open;
  function crypto_box(c, m, d, n, y, x) {
    var k = new Uint8Array(32);
    crypto_box_beforenm(k, y, x);
    return crypto_box_afternm(c, m, d, n, k);
  }
  function crypto_box_open(m, c, d, n, y, x) {
    var k = new Uint8Array(32);
    crypto_box_beforenm(k, y, x);
    return crypto_box_open_afternm(m, c, d, n, k);
  }
  var K = [
    0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
    0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
    0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
    0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
    0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
    0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
    0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
    0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
    0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
    0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
    0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
    0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
    0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
    0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
    0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
    0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
    0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
    0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
    0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
    0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
    0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
    0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
    0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
    0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
    0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
    0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
    0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
    0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
    0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
    0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
    0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
    0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
    0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
    0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
    0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
    0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
    0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
    0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
    0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
    0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
  ];
  function crypto_hashblocks_hl(hh, hl, m, n) {
    var wh = new Int32Array(16), wl = new Int32Array(16),
        bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7,
        bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7,
        th, tl, i, j, h, l, a, b, c, d;
    var ah0 = hh[0],
        ah1 = hh[1],
        ah2 = hh[2],
        ah3 = hh[3],
        ah4 = hh[4],
        ah5 = hh[5],
        ah6 = hh[6],
        ah7 = hh[7],
        al0 = hl[0],
        al1 = hl[1],
        al2 = hl[2],
        al3 = hl[3],
        al4 = hl[4],
        al5 = hl[5],
        al6 = hl[6],
        al7 = hl[7];
    var pos = 0;
    while (n >= 128) {
      for (i = 0; i < 16; i++) {
        j = 8 * i + pos;
        wh[i] = (m[j+0] << 24) | (m[j+1] << 16) | (m[j+2] << 8) | m[j+3];
        wl[i] = (m[j+4] << 24) | (m[j+5] << 16) | (m[j+6] << 8) | m[j+7];
      }
      for (i = 0; i < 80; i++) {
        bh0 = ah0;
        bh1 = ah1;
        bh2 = ah2;
        bh3 = ah3;
        bh4 = ah4;
        bh5 = ah5;
        bh6 = ah6;
        bh7 = ah7;
        bl0 = al0;
        bl1 = al1;
        bl2 = al2;
        bl3 = al3;
        bl4 = al4;
        bl5 = al5;
        bl6 = al6;
        bl7 = al7;
        h = ah7;
        l = al7;
        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;
        h = ((ah4 >>> 14) | (al4 << (32-14))) ^ ((ah4 >>> 18) | (al4 << (32-18))) ^ ((al4 >>> (41-32)) | (ah4 << (32-(41-32))));
        l = ((al4 >>> 14) | (ah4 << (32-14))) ^ ((al4 >>> 18) | (ah4 << (32-18))) ^ ((ah4 >>> (41-32)) | (al4 << (32-(41-32))));
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        h = (ah4 & ah5) ^ (~ah4 & ah6);
        l = (al4 & al5) ^ (~al4 & al6);
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        h = K[i*2];
        l = K[i*2+1];
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        h = wh[i%16];
        l = wl[i%16];
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;
        th = c & 0xffff | d << 16;
        tl = a & 0xffff | b << 16;
        h = th;
        l = tl;
        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;
        h = ((ah0 >>> 28) | (al0 << (32-28))) ^ ((al0 >>> (34-32)) | (ah0 << (32-(34-32)))) ^ ((al0 >>> (39-32)) | (ah0 << (32-(39-32))));
        l = ((al0 >>> 28) | (ah0 << (32-28))) ^ ((ah0 >>> (34-32)) | (al0 << (32-(34-32)))) ^ ((ah0 >>> (39-32)) | (al0 << (32-(39-32))));
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2);
        l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2);
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;
        bh7 = (c & 0xffff) | (d << 16);
        bl7 = (a & 0xffff) | (b << 16);
        h = bh3;
        l = bl3;
        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;
        h = th;
        l = tl;
        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;
        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;
        bh3 = (c & 0xffff) | (d << 16);
        bl3 = (a & 0xffff) | (b << 16);
        ah1 = bh0;
        ah2 = bh1;
        ah3 = bh2;
        ah4 = bh3;
        ah5 = bh4;
        ah6 = bh5;
        ah7 = bh6;
        ah0 = bh7;
        al1 = bl0;
        al2 = bl1;
        al3 = bl2;
        al4 = bl3;
        al5 = bl4;
        al6 = bl5;
        al7 = bl6;
        al0 = bl7;
        if (i%16 === 15) {
          for (j = 0; j < 16; j++) {
            h = wh[j];
            l = wl[j];
            a = l & 0xffff; b = l >>> 16;
            c = h & 0xffff; d = h >>> 16;
            h = wh[(j+9)%16];
            l = wl[(j+9)%16];
            a += l & 0xffff; b += l >>> 16;
            c += h & 0xffff; d += h >>> 16;
            th = wh[(j+1)%16];
            tl = wl[(j+1)%16];
            h = ((th >>> 1) | (tl << (32-1))) ^ ((th >>> 8) | (tl << (32-8))) ^ (th >>> 7);
            l = ((tl >>> 1) | (th << (32-1))) ^ ((tl >>> 8) | (th << (32-8))) ^ ((tl >>> 7) | (th << (32-7)));
            a += l & 0xffff; b += l >>> 16;
            c += h & 0xffff; d += h >>> 16;
            th = wh[(j+14)%16];
            tl = wl[(j+14)%16];
            h = ((th >>> 19) | (tl << (32-19))) ^ ((tl >>> (61-32)) | (th << (32-(61-32)))) ^ (th >>> 6);
            l = ((tl >>> 19) | (th << (32-19))) ^ ((th >>> (61-32)) | (tl << (32-(61-32)))) ^ ((tl >>> 6) | (th << (32-6)));
            a += l & 0xffff; b += l >>> 16;
            c += h & 0xffff; d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            wh[j] = (c & 0xffff) | (d << 16);
            wl[j] = (a & 0xffff) | (b << 16);
          }
        }
      }
      h = ah0;
      l = al0;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[0];
      l = hl[0];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[0] = ah0 = (c & 0xffff) | (d << 16);
      hl[0] = al0 = (a & 0xffff) | (b << 16);
      h = ah1;
      l = al1;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[1];
      l = hl[1];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[1] = ah1 = (c & 0xffff) | (d << 16);
      hl[1] = al1 = (a & 0xffff) | (b << 16);
      h = ah2;
      l = al2;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[2];
      l = hl[2];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[2] = ah2 = (c & 0xffff) | (d << 16);
      hl[2] = al2 = (a & 0xffff) | (b << 16);
      h = ah3;
      l = al3;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[3];
      l = hl[3];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[3] = ah3 = (c & 0xffff) | (d << 16);
      hl[3] = al3 = (a & 0xffff) | (b << 16);
      h = ah4;
      l = al4;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[4];
      l = hl[4];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[4] = ah4 = (c & 0xffff) | (d << 16);
      hl[4] = al4 = (a & 0xffff) | (b << 16);
      h = ah5;
      l = al5;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[5];
      l = hl[5];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[5] = ah5 = (c & 0xffff) | (d << 16);
      hl[5] = al5 = (a & 0xffff) | (b << 16);
      h = ah6;
      l = al6;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[6];
      l = hl[6];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[6] = ah6 = (c & 0xffff) | (d << 16);
      hl[6] = al6 = (a & 0xffff) | (b << 16);
      h = ah7;
      l = al7;
      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;
      h = hh[7];
      l = hl[7];
      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;
      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;
      hh[7] = ah7 = (c & 0xffff) | (d << 16);
      hl[7] = al7 = (a & 0xffff) | (b << 16);
      pos += 128;
      n -= 128;
    }
    return n;
  }
  function crypto_hash(out, m, n) {
    var hh = new Int32Array(8),
        hl = new Int32Array(8),
        x = new Uint8Array(256),
        i, b = n;
    hh[0] = 0x6a09e667;
    hh[1] = 0xbb67ae85;
    hh[2] = 0x3c6ef372;
    hh[3] = 0xa54ff53a;
    hh[4] = 0x510e527f;
    hh[5] = 0x9b05688c;
    hh[6] = 0x1f83d9ab;
    hh[7] = 0x5be0cd19;
    hl[0] = 0xf3bcc908;
    hl[1] = 0x84caa73b;
    hl[2] = 0xfe94f82b;
    hl[3] = 0x5f1d36f1;
    hl[4] = 0xade682d1;
    hl[5] = 0x2b3e6c1f;
    hl[6] = 0xfb41bd6b;
    hl[7] = 0x137e2179;
    crypto_hashblocks_hl(hh, hl, m, n);
    n %= 128;
    for (i = 0; i < n; i++) x[i] = m[b-n+i];
    x[n] = 128;
    n = 256-128*(n<112?1:0);
    x[n-9] = 0;
    ts64(x, n-8,  (b / 0x20000000) | 0, b << 3);
    crypto_hashblocks_hl(hh, hl, x, n);
    for (i = 0; i < 8; i++) ts64(out, 8*i, hh[i], hl[i]);
    return 0;
  }
  function add(p, q) {
    var a = gf(), b = gf(), c = gf(),
        d = gf(), e = gf(), f = gf(),
        g = gf(), h = gf(), t = gf();
    Z(a, p[1], p[0]);
    Z(t, q[1], q[0]);
    M(a, a, t);
    A(b, p[0], p[1]);
    A(t, q[0], q[1]);
    M(b, b, t);
    M(c, p[3], q[3]);
    M(c, c, D2);
    M(d, p[2], q[2]);
    A(d, d, d);
    Z(e, b, a);
    Z(f, d, c);
    A(g, d, c);
    A(h, b, a);
    M(p[0], e, f);
    M(p[1], h, g);
    M(p[2], g, f);
    M(p[3], e, h);
  }
  function cswap(p, q, b) {
    var i;
    for (i = 0; i < 4; i++) {
      sel25519(p[i], q[i], b);
    }
  }
  function pack(r, p) {
    var tx = gf(), ty = gf(), zi = gf();
    inv25519(zi, p[2]);
    M(tx, p[0], zi);
    M(ty, p[1], zi);
    pack25519(r, ty);
    r[31] ^= par25519(tx) << 7;
  }
  function scalarmult(p, q, s) {
    var b, i;
    set25519(p[0], gf0);
    set25519(p[1], gf1);
    set25519(p[2], gf1);
    set25519(p[3], gf0);
    for (i = 255; i >= 0; --i) {
      b = (s[(i/8)|0] >> (i&7)) & 1;
      cswap(p, q, b);
      add(q, p);
      add(p, p);
      cswap(p, q, b);
    }
  }
  function scalarbase(p, s) {
    var q = [gf(), gf(), gf(), gf()];
    set25519(q[0], X);
    set25519(q[1], Y);
    set25519(q[2], gf1);
    M(q[3], X, Y);
    scalarmult(p, q, s);
  }
  function crypto_sign_keypair(pk, sk, seeded) {
    var d = new Uint8Array(64);
    var p = [gf(), gf(), gf(), gf()];
    var i;
    if (!seeded) randombytes(sk, 32);
    crypto_hash(d, sk, 32);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    scalarbase(p, d);
    pack(pk, p);
    for (i = 0; i < 32; i++) sk[i+32] = pk[i];
    return 0;
  }
  var L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);
  function modL(r, x) {
    var carry, i, j, k;
    for (i = 63; i >= 32; --i) {
      carry = 0;
      for (j = i - 32, k = i - 12; j < k; ++j) {
        x[j] += carry - 16 * x[i] * L[j - (i - 32)];
        carry = Math.floor((x[j] + 128) / 256);
        x[j] -= carry * 256;
      }
      x[j] += carry;
      x[i] = 0;
    }
    carry = 0;
    for (j = 0; j < 32; j++) {
      x[j] += carry - (x[31] >> 4) * L[j];
      carry = x[j] >> 8;
      x[j] &= 255;
    }
    for (j = 0; j < 32; j++) x[j] -= carry * L[j];
    for (i = 0; i < 32; i++) {
      x[i+1] += x[i] >> 8;
      r[i] = x[i] & 255;
    }
  }
  function reduce(r) {
    var x = new Float64Array(64), i;
    for (i = 0; i < 64; i++) x[i] = r[i];
    for (i = 0; i < 64; i++) r[i] = 0;
    modL(r, x);
  }
  function crypto_sign(sm, m, n, sk) {
    var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
    var i, j, x = new Float64Array(64);
    var p = [gf(), gf(), gf(), gf()];
    crypto_hash(d, sk, 32);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    var smlen = n + 64;
    for (i = 0; i < n; i++) sm[64 + i] = m[i];
    for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
    crypto_hash(r, sm.subarray(32), n+32);
    reduce(r);
    scalarbase(p, r);
    pack(sm, p);
    for (i = 32; i < 64; i++) sm[i] = sk[i];
    crypto_hash(h, sm, n + 64);
    reduce(h);
    for (i = 0; i < 64; i++) x[i] = 0;
    for (i = 0; i < 32; i++) x[i] = r[i];
    for (i = 0; i < 32; i++) {
      for (j = 0; j < 32; j++) {
        x[i+j] += h[i] * d[j];
      }
    }
    modL(sm.subarray(32), x);
    return smlen;
  }
  function unpackneg(r, p) {
    var t = gf(), chk = gf(), num = gf(),
        den = gf(), den2 = gf(), den4 = gf(),
        den6 = gf();
    set25519(r[2], gf1);
    unpack25519(r[1], p);
    S(num, r[1]);
    M(den, num, D);
    Z(num, num, r[2]);
    A(den, r[2], den);
    S(den2, den);
    S(den4, den2);
    M(den6, den4, den2);
    M(t, den6, num);
    M(t, t, den);
    pow2523(t, t);
    M(t, t, num);
    M(t, t, den);
    M(t, t, den);
    M(r[0], t, den);
    S(chk, r[0]);
    M(chk, chk, den);
    if (neq25519(chk, num)) M(r[0], r[0], I);
    S(chk, r[0]);
    M(chk, chk, den);
    if (neq25519(chk, num)) return -1;
    if (par25519(r[0]) === (p[31]>>7)) Z(r[0], gf0, r[0]);
    M(r[3], r[0], r[1]);
    return 0;
  }
  function crypto_sign_open(m, sm, n, pk) {
    var i;
    var t = new Uint8Array(32), h = new Uint8Array(64);
    var p = [gf(), gf(), gf(), gf()],
        q = [gf(), gf(), gf(), gf()];
    if (n < 64) return -1;
    if (unpackneg(q, pk)) return -1;
    for (i = 0; i < n; i++) m[i] = sm[i];
    for (i = 0; i < 32; i++) m[i+32] = pk[i];
    crypto_hash(h, m, n);
    reduce(h);
    scalarmult(p, q, h);
    scalarbase(q, sm.subarray(32));
    add(p, q);
    pack(t, p);
    n -= 64;
    if (crypto_verify_32(sm, 0, t, 0)) {
      for (i = 0; i < n; i++) m[i] = 0;
      return -1;
    }
    for (i = 0; i < n; i++) m[i] = sm[i + 64];
    return n;
  }
  var crypto_secretbox_KEYBYTES = 32,
      crypto_secretbox_NONCEBYTES = 24,
      crypto_secretbox_ZEROBYTES = 32,
      crypto_secretbox_BOXZEROBYTES = 16,
      crypto_scalarmult_BYTES = 32,
      crypto_scalarmult_SCALARBYTES = 32,
      crypto_box_PUBLICKEYBYTES = 32,
      crypto_box_SECRETKEYBYTES = 32,
      crypto_box_BEFORENMBYTES = 32,
      crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
      crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
      crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
      crypto_sign_BYTES = 64,
      crypto_sign_PUBLICKEYBYTES = 32,
      crypto_sign_SECRETKEYBYTES = 64,
      crypto_sign_SEEDBYTES = 32,
      crypto_hash_BYTES = 64;
  nacl.lowlevel = {
    crypto_core_hsalsa20: crypto_core_hsalsa20,
    crypto_stream_xor: crypto_stream_xor,
    crypto_stream: crypto_stream,
    crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
    crypto_stream_salsa20: crypto_stream_salsa20,
    crypto_onetimeauth: crypto_onetimeauth,
    crypto_onetimeauth_verify: crypto_onetimeauth_verify,
    crypto_verify_16: crypto_verify_16,
    crypto_verify_32: crypto_verify_32,
    crypto_secretbox: crypto_secretbox,
    crypto_secretbox_open: crypto_secretbox_open,
    crypto_scalarmult: crypto_scalarmult,
    crypto_scalarmult_base: crypto_scalarmult_base,
    crypto_box_beforenm: crypto_box_beforenm,
    crypto_box_afternm: crypto_box_afternm,
    crypto_box: crypto_box,
    crypto_box_open: crypto_box_open,
    crypto_box_keypair: crypto_box_keypair,
    crypto_hash: crypto_hash,
    crypto_sign: crypto_sign,
    crypto_sign_keypair: crypto_sign_keypair,
    crypto_sign_open: crypto_sign_open,
    crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
    crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
    crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
    crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
    crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
    crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
    crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
    crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
    crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
    crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
    crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
    crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
    crypto_sign_BYTES: crypto_sign_BYTES,
    crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
    crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
    crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
    crypto_hash_BYTES: crypto_hash_BYTES,
    gf: gf,
    D: D,
    L: L,
    pack25519: pack25519,
    unpack25519: unpack25519,
    M: M,
    A: A,
    S: S,
    Z: Z,
    pow2523: pow2523,
    add: add,
    set25519: set25519,
    modL: modL,
    scalarmult: scalarmult,
    scalarbase: scalarbase,
  };
  function checkLengths(k, n) {
    if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
    if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
  }
  function checkBoxLengths(pk, sk) {
    if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
    if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
  }
  function checkArrayTypes() {
    for (var i = 0; i < arguments.length; i++) {
      if (!(arguments[i] instanceof Uint8Array))
        throw new TypeError('unexpected type, use Uint8Array');
    }
  }
  function cleanup(arr) {
    for (var i = 0; i < arr.length; i++) arr[i] = 0;
  }
  nacl.randomBytes = function(n) {
    var b = new Uint8Array(n);
    randombytes(b, n);
    return b;
  };
  nacl.secretbox = function(msg, nonce, key) {
    checkArrayTypes(msg, nonce, key);
    checkLengths(key, nonce);
    var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
    var c = new Uint8Array(m.length);
    for (var i = 0; i < msg.length; i++) m[i+crypto_secretbox_ZEROBYTES] = msg[i];
    crypto_secretbox(c, m, m.length, nonce, key);
    return c.subarray(crypto_secretbox_BOXZEROBYTES);
  };
  nacl.secretbox.open = function(box, nonce, key) {
    checkArrayTypes(box, nonce, key);
    checkLengths(key, nonce);
    var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
    var m = new Uint8Array(c.length);
    for (var i = 0; i < box.length; i++) c[i+crypto_secretbox_BOXZEROBYTES] = box[i];
    if (c.length < 32) return null;
    if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
    return m.subarray(crypto_secretbox_ZEROBYTES);
  };
  nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
  nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
  nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
  nacl.scalarMult = function(n, p) {
    checkArrayTypes(n, p);
    if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
    if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
    var q = new Uint8Array(crypto_scalarmult_BYTES);
    crypto_scalarmult(q, n, p);
    return q;
  };
  nacl.scalarMult.base = function(n) {
    checkArrayTypes(n);
    if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
    var q = new Uint8Array(crypto_scalarmult_BYTES);
    crypto_scalarmult_base(q, n);
    return q;
  };
  nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
  nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
  nacl.box = function(msg, nonce, publicKey, secretKey) {
    var k = nacl.box.before(publicKey, secretKey);
    return nacl.secretbox(msg, nonce, k);
  };
  nacl.box.before = function(publicKey, secretKey) {
    checkArrayTypes(publicKey, secretKey);
    checkBoxLengths(publicKey, secretKey);
    var k = new Uint8Array(crypto_box_BEFORENMBYTES);
    crypto_box_beforenm(k, publicKey, secretKey);
    return k;
  };
  nacl.box.after = nacl.secretbox;
  nacl.box.open = function(msg, nonce, publicKey, secretKey) {
    var k = nacl.box.before(publicKey, secretKey);
    return nacl.secretbox.open(msg, nonce, k);
  };
  nacl.box.open.after = nacl.secretbox.open;
  nacl.box.keyPair = function() {
    var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
    var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
    crypto_box_keypair(pk, sk);
    return {publicKey: pk, secretKey: sk};
  };
  nacl.box.keyPair.fromSecretKey = function(secretKey) {
    checkArrayTypes(secretKey);
    if (secretKey.length !== crypto_box_SECRETKEYBYTES)
      throw new Error('bad secret key size');
    var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
    crypto_scalarmult_base(pk, secretKey);
    return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
  };
  nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
  nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
  nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
  nacl.box.nonceLength = crypto_box_NONCEBYTES;
  nacl.box.overheadLength = nacl.secretbox.overheadLength;
  nacl.sign = function(msg, secretKey) {
    checkArrayTypes(msg, secretKey);
    if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
      throw new Error('bad secret key size');
    var signedMsg = new Uint8Array(crypto_sign_BYTES+msg.length);
    crypto_sign(signedMsg, msg, msg.length, secretKey);
    return signedMsg;
  };
  nacl.sign.open = function(signedMsg, publicKey) {
    checkArrayTypes(signedMsg, publicKey);
    if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
      throw new Error('bad public key size');
    var tmp = new Uint8Array(signedMsg.length);
    var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
    if (mlen < 0) return null;
    var m = new Uint8Array(mlen);
    for (var i = 0; i < m.length; i++) m[i] = tmp[i];
    return m;
  };
  nacl.sign.detached = function(msg, secretKey) {
    var signedMsg = nacl.sign(msg, secretKey);
    var sig = new Uint8Array(crypto_sign_BYTES);
    for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
    return sig;
  };
  nacl.sign.detached.verify = function(msg, sig, publicKey) {
    checkArrayTypes(msg, sig, publicKey);
    if (sig.length !== crypto_sign_BYTES)
      throw new Error('bad signature size');
    if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
      throw new Error('bad public key size');
    var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
    var m = new Uint8Array(crypto_sign_BYTES + msg.length);
    var i;
    for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
    for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
    return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
  };
  nacl.sign.keyPair = function() {
    var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
    crypto_sign_keypair(pk, sk);
    return {publicKey: pk, secretKey: sk};
  };
  nacl.sign.keyPair.fromSecretKey = function(secretKey) {
    checkArrayTypes(secretKey);
    if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
      throw new Error('bad secret key size');
    var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
    return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
  };
  nacl.sign.keyPair.fromSeed = function(seed) {
    checkArrayTypes(seed);
    if (seed.length !== crypto_sign_SEEDBYTES)
      throw new Error('bad seed size');
    var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
    var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
    for (var i = 0; i < 32; i++) sk[i] = seed[i];
    crypto_sign_keypair(pk, sk, true);
    return {publicKey: pk, secretKey: sk};
  };
  nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
  nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
  nacl.sign.seedLength = crypto_sign_SEEDBYTES;
  nacl.sign.signatureLength = crypto_sign_BYTES;
  nacl.hash = function(msg) {
    checkArrayTypes(msg);
    var h = new Uint8Array(crypto_hash_BYTES);
    crypto_hash(h, msg, msg.length);
    return h;
  };
  nacl.hash.hashLength = crypto_hash_BYTES;
  nacl.verify = function(x, y) {
    checkArrayTypes(x, y);
    if (x.length === 0 || y.length === 0) return false;
    if (x.length !== y.length) return false;
    return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
  };
  nacl.setPRNG = function(fn) {
    randombytes = fn;
  };
  (function() {
    var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
    if (crypto && crypto.getRandomValues) {
      var QUOTA = 65536;
      nacl.setPRNG(function(x, n) {
        var i, v = new Uint8Array(n);
        for (i = 0; i < n; i += QUOTA) {
          crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
        }
        for (i = 0; i < n; i++) x[i] = v[i];
        cleanup(v);
      });
    } else if (typeof commonjsRequire !== 'undefined') {
      crypto = require$$0;
      if (crypto && crypto.randomBytes) {
        nacl.setPRNG(function(x, n) {
          var i, v = crypto.randomBytes(n);
          for (i = 0; i < n; i++) x[i] = v[i];
          cleanup(v);
        });
      }
    }
  })();
  })(module.exports ? module.exports : (self.nacl = self.nacl || {}));
  }(naclFast));
  const nacl = naclFast.exports;

  (function (module) {
  (function(root, f) {
    if (module.exports) module.exports = f(naclFast.exports);
    else root.ed2curve = f(root.nacl);
  }(commonjsGlobal, function(nacl) {
    if (!nacl) throw new Error('tweetnacl not loaded');
    var gf = function(init) {
      var i, r = new Float64Array(16);
      if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
      return r;
    };
    var gf0 = gf(),
        gf1 = gf([1]),
        D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
        I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);
    function car25519(o) {
      var c;
      var i;
      for (i = 0; i < 16; i++) {
        o[i] += 65536;
        c = Math.floor(o[i] / 65536);
        o[(i+1)*(i<15?1:0)] += c - 1 + 37 * (c-1) * (i===15?1:0);
        o[i] -= (c * 65536);
      }
    }
    function sel25519(p, q, b) {
      var t, c = ~(b-1);
      for (var i = 0; i < 16; i++) {
        t = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
      }
    }
    function unpack25519(o, n) {
      var i;
      for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
      o[15] &= 0x7fff;
    }
    function A(o, a, b) {
      var i;
      for (i = 0; i < 16; i++) o[i] = (a[i] + b[i])|0;
    }
    function Z(o, a, b) {
      var i;
      for (i = 0; i < 16; i++) o[i] = (a[i] - b[i])|0;
    }
    function M(o, a, b) {
      var i, j, t = new Float64Array(31);
      for (i = 0; i < 31; i++) t[i] = 0;
      for (i = 0; i < 16; i++) {
        for (j = 0; j < 16; j++) {
          t[i+j] += a[i] * b[j];
        }
      }
      for (i = 0; i < 15; i++) {
        t[i] += 38 * t[i+16];
      }
      for (i = 0; i < 16; i++) o[i] = t[i];
      car25519(o);
      car25519(o);
    }
    function S(o, a) {
      M(o, a, a);
    }
    function inv25519(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 253; a >= 0; a--) {
        S(c, c);
        if(a !== 2 && a !== 4) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }
    function pack25519(o, n) {
      var i, j, b;
      var m = gf(), t = gf();
      for (i = 0; i < 16; i++) t[i] = n[i];
      car25519(t);
      car25519(t);
      car25519(t);
      for (j = 0; j < 2; j++) {
        m[0] = t[0] - 0xffed;
        for (i = 1; i < 15; i++) {
          m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
          m[i-1] &= 0xffff;
        }
        m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
        b = (m[15]>>16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1-b);
      }
      for (i = 0; i < 16; i++) {
        o[2*i] = t[i] & 0xff;
        o[2*i+1] = t[i] >> 8;
      }
    }
    function par25519(a) {
      var d = new Uint8Array(32);
      pack25519(d, a);
      return d[0] & 1;
    }
    function vn(x, xi, y, yi, n) {
      var i, d = 0;
      for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
      return (1 & ((d - 1) >>> 8)) - 1;
    }
    function crypto_verify_32(x, xi, y, yi) {
      return vn(x, xi, y, yi, 32);
    }
    function neq25519(a, b) {
      var c = new Uint8Array(32), d = new Uint8Array(32);
      pack25519(c, a);
      pack25519(d, b);
      return crypto_verify_32(c, 0, d, 0);
    }
    function pow2523(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 250; a >= 0; a--) {
        S(c, c);
        if (a !== 1) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }
    function set25519(r, a) {
      var i;
      for (i = 0; i < 16; i++) r[i] = a[i] | 0;
    }
    function unpackneg(r, p) {
      var t = gf(), chk = gf(), num = gf(),
        den = gf(), den2 = gf(), den4 = gf(),
        den6 = gf();
      set25519(r[2], gf1);
      unpack25519(r[1], p);
      S(num, r[1]);
      M(den, num, D);
      Z(num, num, r[2]);
      A(den, r[2], den);
      S(den2, den);
      S(den4, den2);
      M(den6, den4, den2);
      M(t, den6, num);
      M(t, t, den);
      pow2523(t, t);
      M(t, t, num);
      M(t, t, den);
      M(t, t, den);
      M(r[0], t, den);
      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) M(r[0], r[0], I);
      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) return -1;
      if (par25519(r[0]) === (p[31] >> 7)) Z(r[0], gf0, r[0]);
      M(r[3], r[0], r[1]);
      return 0;
    }
    function convertPublicKey(pk) {
      var z = new Uint8Array(32),
        q = [gf(), gf(), gf(), gf()],
        a = gf(), b = gf();
      if (unpackneg(q, pk)) return null;
      var y = q[1];
      A(a, gf1, y);
      Z(b, gf1, y);
      inv25519(b, b);
      M(a, a, b);
      pack25519(z, a);
      return z;
    }
    function convertSecretKey(sk) {
      var d = new Uint8Array(64), o = new Uint8Array(32), i;
      nacl.lowlevel.crypto_hash(d, sk, 32);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;
      for (i = 0; i < 32; i++) o[i] = d[i];
      for (i = 0; i < 64; i++) d[i] = 0;
      return o;
    }
    function convertKeyPair(edKeyPair) {
      var publicKey = convertPublicKey(edKeyPair.publicKey);
      if (!publicKey) return null;
      return {
        publicKey: publicKey,
        secretKey: convertSecretKey(edKeyPair.secretKey)
      };
    }
    return {
      convertPublicKey: convertPublicKey,
      convertSecretKey: convertSecretKey,
      convertKeyPair: convertKeyPair,
    };
  }));
  }(ed2curve$1));
  const ed2curve = ed2curve$1.exports;

  function convertSecretKeyToCurve25519(secretKey) {
    return ed2curve.convertSecretKey(secretKey);
  }
  function convertPublicKeyToCurve25519(publicKey) {
    return util.assertReturn(ed2curve.convertPublicKey(publicKey), 'Unable to convert publicKey to ed25519');
  }

  const HDKD = util.compactAddLength(util.stringToU8a('Ed25519HDKD'));
  function ed25519DeriveHard(seed, chainCode) {
    util.assert(util.isU8a(chainCode) && chainCode.length === 32, 'Invalid chainCode passed to derive');
    return blake2AsU8a(util.u8aConcat(HDKD, seed, chainCode));
  }

  function randomAsU8a(length = 32) {
    return getRandomValues(new Uint8Array(length));
  }
  const randomAsHex = createAsHex(randomAsU8a);

  const BN_53 = new util.BN(0b11111111111111111111111111111111111111111111111111111);
  function randomAsNumber() {
    return util.hexToBn(randomAsHex(8)).and(BN_53).toNumber();
  }

  function ed25519PairFromSeed(seed, onlyJs) {
    if (!onlyJs && isReady()) {
      const full = ed25519KeypairFromSeed(seed);
      return {
        publicKey: full.slice(32),
        secretKey: full.slice(0, 64)
      };
    }
    return nacl.sign.keyPair.fromSeed(seed);
  }

  function ed25519PairFromRandom() {
    return ed25519PairFromSeed(randomAsU8a());
  }

  function ed25519PairFromSecret(secret) {
    return nacl.sign.keyPair.fromSecretKey(secret);
  }

  function ed25519PairFromString(value) {
    return ed25519PairFromSeed(blake2AsU8a(util.stringToU8a(value)));
  }

  function ed25519Sign(message, {
    publicKey,
    secretKey
  }, onlyJs) {
    util.assert(secretKey, 'Expected a valid secretKey');
    const messageU8a = util.u8aToU8a(message);
    return !onlyJs && isReady() ? ed25519Sign$1(publicKey, secretKey.subarray(0, 32), messageU8a) : nacl.sign.detached(messageU8a, secretKey);
  }

  function ed25519Verify(message, signature, publicKey, onlyJs) {
    const messageU8a = util.u8aToU8a(message);
    const publicKeyU8a = util.u8aToU8a(publicKey);
    const signatureU8a = util.u8aToU8a(signature);
    util.assert(publicKeyU8a.length === 32, () => `Invalid publicKey, received ${publicKeyU8a.length}, expected 32`);
    util.assert(signatureU8a.length === 64, () => `Invalid signature, received ${signatureU8a.length} bytes, expected 64`);
    return !onlyJs && isReady() ? ed25519Verify$1(signatureU8a, messageU8a, publicKeyU8a) : nacl.sign.detached.verify(messageU8a, signatureU8a, publicKeyU8a);
  }

  const keyHdkdEd25519 = createSeedDeriveFn(ed25519PairFromSeed, ed25519DeriveHard);

  const SEC_LEN = 64;
  const PUB_LEN = 32;
  const TOT_LEN = SEC_LEN + PUB_LEN;
  function sr25519PairFromU8a(full) {
    const fullU8a = util.u8aToU8a(full);
    util.assert(fullU8a.length === TOT_LEN, () => `Expected keypair with ${TOT_LEN} bytes, found ${fullU8a.length}`);
    return {
      publicKey: fullU8a.slice(SEC_LEN, TOT_LEN),
      secretKey: fullU8a.slice(0, SEC_LEN)
    };
  }

  function sr25519KeypairToU8a({
    publicKey,
    secretKey
  }) {
    return util.u8aConcat(secretKey, publicKey).slice();
  }

  function createDeriveFn(derive) {
    return (keypair, chainCode) => {
      util.assert(util.isU8a(chainCode) && chainCode.length === 32, 'Invalid chainCode passed to derive');
      return sr25519PairFromU8a(derive(sr25519KeypairToU8a(keypair), chainCode));
    };
  }

  const sr25519DeriveHard = createDeriveFn(sr25519DeriveKeypairHard);

  const sr25519DeriveSoft = createDeriveFn(sr25519DeriveKeypairSoft);

  function keyHdkdSr25519(keypair, {
    chainCode,
    isSoft
  }) {
    return isSoft ? sr25519DeriveSoft(keypair, chainCode) : sr25519DeriveHard(keypair, chainCode);
  }

  const generators = {
    ecdsa: keyHdkdEcdsa,
    ed25519: keyHdkdEd25519,
    ethereum: keyHdkdEcdsa,
    sr25519: keyHdkdSr25519
  };
  function keyFromPath(pair, path, type) {
    const keyHdkd = generators[type];
    let result = pair;
    for (const junction of path) {
      result = keyHdkd(result, junction);
    }
    return result;
  }

  function sr25519Agreement(secretKey, publicKey) {
    const secretKeyU8a = util.u8aToU8a(secretKey);
    const publicKeyU8a = util.u8aToU8a(publicKey);
    util.assert(publicKeyU8a.length === 32, () => `Invalid publicKey, received ${publicKeyU8a.length} bytes, expected 32`);
    util.assert(secretKeyU8a.length === 64, () => `Invalid secretKey, received ${secretKeyU8a.length} bytes, expected 64`);
    return sr25519Agree(publicKeyU8a, secretKeyU8a);
  }

  function sr25519DerivePublic(publicKey, chainCode) {
    const publicKeyU8a = util.u8aToU8a(publicKey);
    util.assert(util.isU8a(chainCode) && chainCode.length === 32, 'Invalid chainCode passed to derive');
    util.assert(publicKeyU8a.length === 32, () => `Invalid publicKey, received ${publicKeyU8a.length} bytes, expected 32`);
    return sr25519DerivePublicSoft(publicKeyU8a, chainCode);
  }

  function sr25519PairFromSeed(seed) {
    const seedU8a = util.u8aToU8a(seed);
    util.assert(seedU8a.length === 32, () => `Expected a seed matching 32 bytes, found ${seedU8a.length}`);
    return sr25519PairFromU8a(sr25519KeypairFromSeed(seedU8a));
  }

  function sr25519Sign(message, {
    publicKey,
    secretKey
  }) {
    util.assert((publicKey === null || publicKey === void 0 ? void 0 : publicKey.length) === 32, 'Expected a valid publicKey, 32-bytes');
    util.assert((secretKey === null || secretKey === void 0 ? void 0 : secretKey.length) === 64, 'Expected a valid secretKey, 64-bytes');
    return sr25519Sign$1(publicKey, secretKey, util.u8aToU8a(message));
  }

  function sr25519Verify(message, signature, publicKey) {
    const publicKeyU8a = util.u8aToU8a(publicKey);
    const signatureU8a = util.u8aToU8a(signature);
    util.assert(publicKeyU8a.length === 32, () => `Invalid publicKey, received ${publicKeyU8a.length} bytes, expected 32`);
    util.assert(signatureU8a.length === 64, () => `Invalid signature, received ${signatureU8a.length} bytes, expected 64`);
    return sr25519Verify$1(signatureU8a, util.u8aToU8a(message), publicKeyU8a);
  }

  const EMPTY_U8A$1 = new Uint8Array();
  function sr25519VrfSign(message, {
    secretKey
  }, context = EMPTY_U8A$1, extra = EMPTY_U8A$1) {
    util.assert((secretKey === null || secretKey === void 0 ? void 0 : secretKey.length) === 64, 'Invalid secretKey, expected 64-bytes');
    return vrfSign(secretKey, util.u8aToU8a(context), util.u8aToU8a(message), util.u8aToU8a(extra));
  }

  const EMPTY_U8A = new Uint8Array();
  function sr25519VrfVerify(message, signOutput, publicKey, context = EMPTY_U8A, extra = EMPTY_U8A) {
    const publicKeyU8a = util.u8aToU8a(publicKey);
    const proofU8a = util.u8aToU8a(signOutput);
    util.assert(publicKeyU8a.length === 32, 'Invalid publicKey, expected 32-bytes');
    util.assert(proofU8a.length === 96, 'Invalid vrfSign output, expected 96 bytes');
    return vrfVerify(publicKeyU8a, util.u8aToU8a(context), util.u8aToU8a(message), util.u8aToU8a(extra), proofU8a);
  }

  function encodeAddress(key, ss58Format = defaults.prefix) {
    const u8a = decodeAddress(key);
    util.assert(ss58Format >= 0 && ss58Format <= 16383 && ![46, 47].includes(ss58Format), 'Out of range ss58Format specified');
    util.assert(defaults.allowedDecodedLengths.includes(u8a.length), () => `Expected a valid key to convert, with length ${defaults.allowedDecodedLengths.join(', ')}`);
    const input = util.u8aConcat(ss58Format < 64 ? [ss58Format] : [(ss58Format & 0b0000000011111100) >> 2 | 0b01000000, ss58Format >> 8 | (ss58Format & 0b0000000000000011) << 6], u8a);
    return base58Encode(util.u8aConcat(input, sshash(input).subarray(0, [32, 33].includes(u8a.length) ? 2 : 1)));
  }

  function filterHard({
    isHard
  }) {
    return isHard;
  }
  function deriveAddress(who, suri, ss58Format) {
    const {
      path
    } = keyExtractPath(suri);
    util.assert(path.length && !path.every(filterHard), 'Expected suri to contain a combination of non-hard paths');
    let publicKey = decodeAddress(who);
    for (const {
      chainCode
    } of path) {
      publicKey = sr25519DerivePublic(publicKey, chainCode);
    }
    return encodeAddress(publicKey, ss58Format);
  }

  function encodeDerivedAddress(who, index, ss58Format) {
    return encodeAddress(createKeyDerived(decodeAddress(who), index), ss58Format);
  }

  function encodeMultiAddress(who, threshold, ss58Format) {
    return encodeAddress(createKeyMulti(who, threshold), ss58Format);
  }

  const [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [[], [], []];
  const _0n = BigInt(0);
  const _1n = BigInt(1);
  const _2n = BigInt(2);
  const _7n$1 = BigInt(7);
  const _256n$1 = BigInt(256);
  const _0x71n = BigInt(0x71);
  for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
          R = ((R << _1n) ^ ((R >> _7n$1) * _0x71n)) % _256n$1;
          if (R & _2n)
              t ^= _1n << ((_1n << BigInt(j)) - _1n);
      }
      _SHA3_IOTA.push(t);
  }
  const [SHA3_IOTA_H, SHA3_IOTA_L] = split(_SHA3_IOTA, true);
  const rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
  const rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
  function keccakP(s, rounds = 24) {
      const B = new Uint32Array(5 * 2);
      for (let round = 24 - rounds; round < 24; round++) {
          for (let x = 0; x < 10; x++)
              B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
          for (let x = 0; x < 10; x += 2) {
              const idx1 = (x + 8) % 10;
              const idx0 = (x + 2) % 10;
              const B0 = B[idx0];
              const B1 = B[idx0 + 1];
              const Th = rotlH(B0, B1, 1) ^ B[idx1];
              const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
              for (let y = 0; y < 50; y += 10) {
                  s[x + y] ^= Th;
                  s[x + y + 1] ^= Tl;
              }
          }
          let curH = s[2];
          let curL = s[3];
          for (let t = 0; t < 24; t++) {
              const shift = SHA3_ROTL[t];
              const Th = rotlH(curH, curL, shift);
              const Tl = rotlL(curH, curL, shift);
              const PI = SHA3_PI[t];
              curH = s[PI];
              curL = s[PI + 1];
              s[PI] = Th;
              s[PI + 1] = Tl;
          }
          for (let y = 0; y < 50; y += 10) {
              for (let x = 0; x < 10; x++)
                  B[x] = s[y + x];
              for (let x = 0; x < 10; x++)
                  s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
          }
          s[0] ^= SHA3_IOTA_H[round];
          s[1] ^= SHA3_IOTA_L[round];
      }
      B.fill(0);
  }
  class Keccak extends Hash {
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
          super();
          this.blockLen = blockLen;
          this.suffix = suffix;
          this.outputLen = outputLen;
          this.enableXOF = enableXOF;
          this.rounds = rounds;
          this.pos = 0;
          this.posOut = 0;
          this.finished = false;
          this.destroyed = false;
          assertNumber(outputLen);
          if (0 >= this.blockLen || this.blockLen >= 200)
              throw new Error('Sha3 supports only keccak-f1600 function');
          this.state = new Uint8Array(200);
          this.state32 = u32(this.state);
      }
      keccak() {
          keccakP(this.state32, this.rounds);
          this.posOut = 0;
          this.pos = 0;
      }
      update(data) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          if (this.finished)
              throw new Error('digest() was already called');
          const { blockLen, state } = this;
          data = toBytes(data);
          const len = data.length;
          for (let pos = 0; pos < len;) {
              const take = Math.min(blockLen - this.pos, len - pos);
              for (let i = 0; i < take; i++)
                  state[this.pos++] ^= data[pos++];
              if (this.pos === blockLen)
                  this.keccak();
          }
          return this;
      }
      finish() {
          if (this.finished)
              return;
          this.finished = true;
          const { state, suffix, pos, blockLen } = this;
          state[pos] ^= suffix;
          if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
              this.keccak();
          state[blockLen - 1] ^= 0x80;
          this.keccak();
      }
      writeInto(out) {
          if (this.destroyed)
              throw new Error('instance is destroyed');
          if (!(out instanceof Uint8Array))
              throw new Error('Keccak: invalid output buffer');
          this.finish();
          for (let pos = 0, len = out.length; pos < len;) {
              if (this.posOut >= this.blockLen)
                  this.keccak();
              const take = Math.min(this.blockLen - this.posOut, len - pos);
              out.set(this.state.subarray(this.posOut, this.posOut + take), pos);
              this.posOut += take;
              pos += take;
          }
          return out;
      }
      xofInto(out) {
          if (!this.enableXOF)
              throw new Error('XOF is not possible for this instance');
          return this.writeInto(out);
      }
      xof(bytes) {
          assertNumber(bytes);
          return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
          if (out.length < this.outputLen)
              throw new Error('Keccak: invalid output buffer');
          if (this.finished)
              throw new Error('digest() was already called');
          this.finish();
          this.writeInto(out);
          this.destroy();
          return out;
      }
      digest() {
          return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
          this.destroyed = true;
          this.state.fill(0);
      }
      _cloneInto(to) {
          const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
          to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
          to.state32.set(this.state32);
          to.pos = this.pos;
          to.posOut = this.posOut;
          to.finished = this.finished;
          to.rounds = rounds;
          to.suffix = suffix;
          to.outputLen = outputLen;
          to.enableXOF = enableXOF;
          to.destroyed = this.destroyed;
          return to;
      }
  }
  const gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
  gen(0x06, 144, 224 / 8);
  gen(0x06, 136, 256 / 8);
  gen(0x06, 104, 384 / 8);
  gen(0x06, 72, 512 / 8);
  gen(0x01, 144, 224 / 8);
  const keccak_256 = gen(0x01, 136, 256 / 8);
  gen(0x01, 104, 384 / 8);
  const keccak_512 = gen(0x01, 72, 512 / 8);
  const genShake = (suffix, blockLen, outputLen) => wrapConstructorWithOpts((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen !== undefined ? opts.dkLen : outputLen, true));
  genShake(0x1f, 168, 128 / 8);
  genShake(0x1f, 136, 256 / 8);

  const keccakAsU8a = createDualHasher({
    256: keccak256,
    512: keccak512
  }, {
    256: keccak_256,
    512: keccak_512
  });
  const keccak256AsU8a = createBitHasher(256, keccakAsU8a);
  const keccak512AsU8a = createBitHasher(512, keccakAsU8a);
  const keccakAsHex = createAsHex(keccakAsU8a);

  function hasher(hashType, data, onlyJs) {
    return hashType === 'keccak' ? keccakAsU8a(data, undefined, onlyJs) : blake2AsU8a(data, undefined, undefined, onlyJs);
  }

  function evmToAddress(evmAddress, ss58Format, hashType = 'blake2') {
    const message = util.u8aConcat('evm:', evmAddress);
    util.assert(message.length === 24, () => `Converting ${evmAddress}: Invalid evm address length`);
    return encodeAddress(hasher(hashType, message), ss58Format);
  }

  function addressEq(a, b) {
    return util.u8aEq(decodeAddress(a), decodeAddress(b));
  }

  function validateAddress(encoded, ignoreChecksum, ss58Format) {
    return !!decodeAddress(encoded, ignoreChecksum, ss58Format);
  }

  function isAddress(address, ignoreChecksum, ss58Format) {
    try {
      return validateAddress(address, ignoreChecksum, ss58Format);
    } catch (error) {
      return false;
    }
  }

  const l = util.logger('setSS58Format');
  function setSS58Format(prefix) {
    l.warn('Global setting of the ss58Format is deprecated and not recommended. Set format on the keyring (if used) or as pat of the address encode function');
    defaults.prefix = prefix;
  }

  function sortAddresses(addresses, ss58Format) {
    const u8aToAddress = u8a => encodeAddress(u8a, ss58Format);
    return util.u8aSorted(addresses.map(addressToU8a)).map(u8aToAddress);
  }

  const chars = 'abcdefghijklmnopqrstuvwxyz234567';
  const config$1 = {
    chars,
    coder: base.utils.chain(
    base.utils.radix2(5), base.utils.alphabet(chars), {
      decode: input => input.split(''),
      encode: input => input.join('')
    }),
    ipfs: 'b',
    type: 'base32'
  };
  const base32Validate = createValidate(config$1);
  const isBase32 = createIs(base32Validate);
  const base32Decode = createDecode(config$1, base32Validate);
  const base32Encode = createEncode(config$1);

  const config = {
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    coder: base.base64,
    type: 'base64'
  };
  const base64Validate = createValidate(config);
  const isBase64 = createIs(base64Validate);
  const base64Decode = createDecode(config, base64Validate);
  const base64Encode = createEncode(config);

  function base64Pad(value) {
    return value.padEnd(value.length + value.length % 4, '=');
  }

  function base64Trim(value) {
    while (value.length && value[value.length - 1] === '=') {
      value = value.slice(0, -1);
    }
    return value;
  }

  function secp256k1Compress(publicKey, onlyJs) {
    if (publicKey.length === 33) {
      return publicKey;
    }
    util.assert(publicKey.length === 65, 'Invalid publicKey provided');
    return !util.hasBigInt || !onlyJs && isReady() ? secp256k1Compress$1(publicKey) : Point.fromHex(publicKey).toRawBytes(true);
  }

  function secp256k1Expand(publicKey, onlyJs) {
    if (publicKey.length === 65) {
      return publicKey.subarray(1);
    }
    util.assert(publicKey.length === 33, 'Invalid publicKey provided');
    if (!util.hasBigInt || !onlyJs && isReady()) {
      return secp256k1Expand$1(publicKey).subarray(1);
    }
    const {
      x,
      y
    } = Point.fromHex(publicKey);
    return util.u8aConcat(util.bnToU8a(x, BN_BE_256_OPTS), util.bnToU8a(y, BN_BE_256_OPTS));
  }

  function secp256k1Recover(msgHash, signature, recovery, hashType = 'blake2', onlyJs) {
    const sig = util.u8aToU8a(signature).subarray(0, 64);
    const msg = util.u8aToU8a(msgHash);
    const publicKey = !util.hasBigInt || !onlyJs && isReady() ? secp256k1Recover$1(msg, sig, recovery) : recoverPublicKey(msg, Signature.fromCompact(sig).toRawBytes(), recovery);
    util.assert(publicKey, 'Unable to recover publicKey from signature');
    return hashType === 'keccak' ? secp256k1Expand(publicKey, onlyJs) : secp256k1Compress(publicKey, onlyJs);
  }

  function secp256k1Sign(message, {
    secretKey
  }, hashType = 'blake2', onlyJs) {
    util.assert((secretKey === null || secretKey === void 0 ? void 0 : secretKey.length) === 32, 'Expected valid secp256k1 secretKey, 32-bytes');
    const data = hasher(hashType, message, onlyJs);
    if (!util.hasBigInt || !onlyJs && isReady()) {
      return secp256k1Sign$1(data, secretKey);
    }
    const [sigBytes, recoveryParam] = signSync(data, secretKey, {
      canonical: true,
      recovered: true
    });
    const {
      r,
      s
    } = Signature.fromHex(sigBytes);
    return util.u8aConcat(util.bnToU8a(r, BN_BE_256_OPTS), util.bnToU8a(s, BN_BE_256_OPTS), new Uint8Array([recoveryParam || 0]));
  }

  const N = 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141'.replace(/ /g, '');
  const N_BI = BigInt$1(`0x${N}`);
  const N_BN = new util.BN(N, 'hex');
  function addBi(seckey, tweak) {
    let res = util.u8aToBigInt(tweak, BN_BE_OPTS);
    util.assert(res < N_BI, 'Tweak parameter is out of range');
    res += util.u8aToBigInt(seckey, BN_BE_OPTS);
    if (res >= N_BI) {
      res -= N_BI;
    }
    util.assert(res !== util._0n, 'Invalid resulting private key');
    return util.nToU8a(res, BN_BE_256_OPTS);
  }
  function addBn(seckey, tweak) {
    const res = new util.BN(tweak);
    util.assert(res.cmp(N_BN) < 0, 'Tweak parameter is out of range');
    res.iadd(new util.BN(seckey));
    if (res.cmp(N_BN) >= 0) {
      res.isub(N_BN);
    }
    util.assert(!res.isZero(), 'Invalid resulting private key');
    return util.bnToU8a(res, BN_BE_256_OPTS);
  }
  function secp256k1PrivateKeyTweakAdd(seckey, tweak, onlyBn) {
    util.assert(util.isU8a(seckey) && seckey.length === 32, 'Expected seckey to be an Uint8Array with length 32');
    util.assert(util.isU8a(tweak) && tweak.length === 32, 'Expected tweak to be an Uint8Array with length 32');
    return !util.hasBigInt || onlyBn ? addBn(seckey, tweak) : addBi(seckey, tweak);
  }

  function secp256k1Verify(msgHash, signature, address, hashType = 'blake2', onlyJs) {
    const sig = util.u8aToU8a(signature);
    util.assert(sig.length === 65, `Expected signature with 65 bytes, ${sig.length} found instead`);
    const publicKey = secp256k1Recover(hasher(hashType, msgHash), sig, sig[64], hashType, onlyJs);
    const signerAddr = hasher(hashType, publicKey, onlyJs);
    const inputAddr = util.u8aToU8a(address);
    return util.u8aEq(publicKey, inputAddr) || (hashType === 'keccak' ? util.u8aEq(signerAddr.slice(-20), inputAddr.slice(-20)) : util.u8aEq(signerAddr, inputAddr));
  }

  function getH160(u8a) {
    if ([33, 65].includes(u8a.length)) {
      u8a = keccakAsU8a(secp256k1Expand(u8a));
    }
    return u8a.slice(-20);
  }
  function ethereumEncode(addressOrPublic) {
    if (!addressOrPublic) {
      return '0x';
    }
    const u8aAddress = util.u8aToU8a(addressOrPublic);
    util.assert([20, 32, 33, 65].includes(u8aAddress.length), 'Invalid address or publicKey passed');
    const address = util.u8aToHex(getH160(u8aAddress), -1, false);
    const hash = util.u8aToHex(keccakAsU8a(address), -1, false);
    let result = '';
    for (let i = 0; i < 40; i++) {
      result = `${result}${parseInt(hash[i], 16) > 7 ? address[i].toUpperCase() : address[i]}`;
    }
    return `0x${result}`;
  }

  function isInvalidChar(char, byte) {
    return char !== (byte > 7 ? char.toUpperCase() : char.toLowerCase());
  }
  function isEthereumChecksum(_address) {
    const address = _address.replace('0x', '');
    const hash = util.u8aToHex(keccakAsU8a(address.toLowerCase()), -1, false);
    for (let i = 0; i < 40; i++) {
      if (isInvalidChar(address[i], parseInt(hash[i], 16))) {
        return false;
      }
    }
    return true;
  }

  function isEthereumAddress(address) {
    if (!address || address.length !== 42 || !util.isHex(address)) {
      return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
      return true;
    }
    return isEthereumChecksum(address);
  }

  const HARDENED = 0x80000000;
  function hdValidatePath(path) {
    if (!path.startsWith('m/')) {
      return false;
    }
    const parts = path.split('/').slice(1);
    for (const p of parts) {
      const n = /^\d+'?$/.test(p) ? parseInt(p.replace(/'$/, ''), 10) : Number.NaN;
      if (isNaN(n) || n >= HARDENED || n < 0) {
        return false;
      }
    }
    return true;
  }

  const MASTER_SECRET = util.stringToU8a('Bitcoin seed');
  function createCoded(secretKey, chainCode) {
    return {
      chainCode,
      publicKey: secp256k1PairFromSeed(secretKey).publicKey,
      secretKey
    };
  }
  function deriveChild(hd, index) {
    const indexBuffer = util.bnToU8a(index, BN_BE_32_OPTS);
    const data = index >= HARDENED ? util.u8aConcat(new Uint8Array(1), hd.secretKey, indexBuffer) : util.u8aConcat(hd.publicKey, indexBuffer);
    try {
      const I = hmacShaAsU8a(hd.chainCode, data, 512);
      return createCoded(secp256k1PrivateKeyTweakAdd(hd.secretKey, I.slice(0, 32)), I.slice(32));
    } catch (err) {
      return deriveChild(hd, index + 1);
    }
  }
  function hdEthereum(seed, path = '') {
    const I = hmacShaAsU8a(MASTER_SECRET, seed, 512);
    let hd = createCoded(I.slice(0, 32), I.slice(32));
    if (!path || path === 'm' || path === 'M' || path === "m'" || path === "M'") {
      return hd;
    }
    util.assert(hdValidatePath(path), 'Invalid derivation path');
    const parts = path.split('/').slice(1);
    for (const p of parts) {
      hd = deriveChild(hd, parseInt(p, 10) + (p.length > 1 && p.endsWith("'") ? HARDENED : 0));
    }
    return hd;
  }

  function pbkdf2Init(hash, _password, _salt, _opts) {
      assertHash(hash);
      const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
      const { c, dkLen, asyncTick } = opts;
      assertNumber(c);
      assertNumber(dkLen);
      assertNumber(asyncTick);
      if (c < 1)
          throw new Error('PBKDF2: iterations (c) should be >= 1');
      const password = toBytes(_password);
      const salt = toBytes(_salt);
      const DK = new Uint8Array(dkLen);
      const PRF = hmac.create(hash, password);
      const PRFSalt = PRF._cloneInto().update(salt);
      return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
  }
  function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
      PRF.destroy();
      PRFSalt.destroy();
      if (prfW)
          prfW.destroy();
      u.fill(0);
      return DK;
  }
  function pbkdf2(hash, password, salt, opts) {
      const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
      let prfW;
      const arr = new Uint8Array(4);
      const view = createView(arr);
      const u = new Uint8Array(PRF.outputLen);
      for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
          const Ti = DK.subarray(pos, pos + PRF.outputLen);
          view.setInt32(0, ti, false);
          (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
          Ti.set(u.subarray(0, Ti.length));
          for (let ui = 1; ui < c; ui++) {
              PRF._cloneInto(prfW).update(u).digestInto(u);
              for (let i = 0; i < Ti.length; i++)
                  Ti[i] ^= u[i];
          }
      }
      return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
  }

  function pbkdf2Encode(passphrase, salt = randomAsU8a(), rounds = 2048, onlyJs) {
    const u8aPass = util.u8aToU8a(passphrase);
    const u8aSalt = util.u8aToU8a(salt);
    return {
      password: !util.hasBigInt || !onlyJs && isReady() ? pbkdf2$1(u8aPass, u8aSalt, rounds) : pbkdf2(sha512, u8aPass, u8aSalt, {
        c: rounds,
        dkLen: 64
      }),
      rounds,
      salt
    };
  }

  const shaAsU8a = createDualHasher({
    256: sha256$1,
    512: sha512$1
  }, {
    256: sha256,
    512: sha512
  });
  const sha256AsU8a = createBitHasher(256, shaAsU8a);
  const sha512AsU8a = createBitHasher(512, shaAsU8a);

  const DEFAULT_WORDLIST = 'abandon|ability|able|about|above|absent|absorb|abstract|absurd|abuse|access|accident|account|accuse|achieve|acid|acoustic|acquire|across|act|action|actor|actress|actual|adapt|add|addict|address|adjust|admit|adult|advance|advice|aerobic|affair|afford|afraid|again|age|agent|agree|ahead|aim|air|airport|aisle|alarm|album|alcohol|alert|alien|all|alley|allow|almost|alone|alpha|already|also|alter|always|amateur|amazing|among|amount|amused|analyst|anchor|ancient|anger|angle|angry|animal|ankle|announce|annual|another|answer|antenna|antique|anxiety|any|apart|apology|appear|apple|approve|april|arch|arctic|area|arena|argue|arm|armed|armor|army|around|arrange|arrest|arrive|arrow|art|artefact|artist|artwork|ask|aspect|assault|asset|assist|assume|asthma|athlete|atom|attack|attend|attitude|attract|auction|audit|august|aunt|author|auto|autumn|average|avocado|avoid|awake|aware|away|awesome|awful|awkward|axis|baby|bachelor|bacon|badge|bag|balance|balcony|ball|bamboo|banana|banner|bar|barely|bargain|barrel|base|basic|basket|battle|beach|bean|beauty|because|become|beef|before|begin|behave|behind|believe|below|belt|bench|benefit|best|betray|better|between|beyond|bicycle|bid|bike|bind|biology|bird|birth|bitter|black|blade|blame|blanket|blast|bleak|bless|blind|blood|blossom|blouse|blue|blur|blush|board|boat|body|boil|bomb|bone|bonus|book|boost|border|boring|borrow|boss|bottom|bounce|box|boy|bracket|brain|brand|brass|brave|bread|breeze|brick|bridge|brief|bright|bring|brisk|broccoli|broken|bronze|broom|brother|brown|brush|bubble|buddy|budget|buffalo|build|bulb|bulk|bullet|bundle|bunker|burden|burger|burst|bus|business|busy|butter|buyer|buzz|cabbage|cabin|cable|cactus|cage|cake|call|calm|camera|camp|can|canal|cancel|candy|cannon|canoe|canvas|canyon|capable|capital|captain|car|carbon|card|cargo|carpet|carry|cart|case|cash|casino|castle|casual|cat|catalog|catch|category|cattle|caught|cause|caution|cave|ceiling|celery|cement|census|century|cereal|certain|chair|chalk|champion|change|chaos|chapter|charge|chase|chat|cheap|check|cheese|chef|cherry|chest|chicken|chief|child|chimney|choice|choose|chronic|chuckle|chunk|churn|cigar|cinnamon|circle|citizen|city|civil|claim|clap|clarify|claw|clay|clean|clerk|clever|click|client|cliff|climb|clinic|clip|clock|clog|close|cloth|cloud|clown|club|clump|cluster|clutch|coach|coast|coconut|code|coffee|coil|coin|collect|color|column|combine|come|comfort|comic|common|company|concert|conduct|confirm|congress|connect|consider|control|convince|cook|cool|copper|copy|coral|core|corn|correct|cost|cotton|couch|country|couple|course|cousin|cover|coyote|crack|cradle|craft|cram|crane|crash|crater|crawl|crazy|cream|credit|creek|crew|cricket|crime|crisp|critic|crop|cross|crouch|crowd|crucial|cruel|cruise|crumble|crunch|crush|cry|crystal|cube|culture|cup|cupboard|curious|current|curtain|curve|cushion|custom|cute|cycle|dad|damage|damp|dance|danger|daring|dash|daughter|dawn|day|deal|debate|debris|decade|december|decide|decline|decorate|decrease|deer|defense|define|defy|degree|delay|deliver|demand|demise|denial|dentist|deny|depart|depend|deposit|depth|deputy|derive|describe|desert|design|desk|despair|destroy|detail|detect|develop|device|devote|diagram|dial|diamond|diary|dice|diesel|diet|differ|digital|dignity|dilemma|dinner|dinosaur|direct|dirt|disagree|discover|disease|dish|dismiss|disorder|display|distance|divert|divide|divorce|dizzy|doctor|document|dog|doll|dolphin|domain|donate|donkey|donor|door|dose|double|dove|draft|dragon|drama|drastic|draw|dream|dress|drift|drill|drink|drip|drive|drop|drum|dry|duck|dumb|dune|during|dust|dutch|duty|dwarf|dynamic|eager|eagle|early|earn|earth|easily|east|easy|echo|ecology|economy|edge|edit|educate|effort|egg|eight|either|elbow|elder|electric|elegant|element|elephant|elevator|elite|else|embark|embody|embrace|emerge|emotion|employ|empower|empty|enable|enact|end|endless|endorse|enemy|energy|enforce|engage|engine|enhance|enjoy|enlist|enough|enrich|enroll|ensure|enter|entire|entry|envelope|episode|equal|equip|era|erase|erode|erosion|error|erupt|escape|essay|essence|estate|eternal|ethics|evidence|evil|evoke|evolve|exact|example|excess|exchange|excite|exclude|excuse|execute|exercise|exhaust|exhibit|exile|exist|exit|exotic|expand|expect|expire|explain|expose|express|extend|extra|eye|eyebrow|fabric|face|faculty|fade|faint|faith|fall|false|fame|family|famous|fan|fancy|fantasy|farm|fashion|fat|fatal|father|fatigue|fault|favorite|feature|february|federal|fee|feed|feel|female|fence|festival|fetch|fever|few|fiber|fiction|field|figure|file|film|filter|final|find|fine|finger|finish|fire|firm|first|fiscal|fish|fit|fitness|fix|flag|flame|flash|flat|flavor|flee|flight|flip|float|flock|floor|flower|fluid|flush|fly|foam|focus|fog|foil|fold|follow|food|foot|force|forest|forget|fork|fortune|forum|forward|fossil|foster|found|fox|fragile|frame|frequent|fresh|friend|fringe|frog|front|frost|frown|frozen|fruit|fuel|fun|funny|furnace|fury|future|gadget|gain|galaxy|gallery|game|gap|garage|garbage|garden|garlic|garment|gas|gasp|gate|gather|gauge|gaze|general|genius|genre|gentle|genuine|gesture|ghost|giant|gift|giggle|ginger|giraffe|girl|give|glad|glance|glare|glass|glide|glimpse|globe|gloom|glory|glove|glow|glue|goat|goddess|gold|good|goose|gorilla|gospel|gossip|govern|gown|grab|grace|grain|grant|grape|grass|gravity|great|green|grid|grief|grit|grocery|group|grow|grunt|guard|guess|guide|guilt|guitar|gun|gym|habit|hair|half|hammer|hamster|hand|happy|harbor|hard|harsh|harvest|hat|have|hawk|hazard|head|health|heart|heavy|hedgehog|height|hello|helmet|help|hen|hero|hidden|high|hill|hint|hip|hire|history|hobby|hockey|hold|hole|holiday|hollow|home|honey|hood|hope|horn|horror|horse|hospital|host|hotel|hour|hover|hub|huge|human|humble|humor|hundred|hungry|hunt|hurdle|hurry|hurt|husband|hybrid|ice|icon|idea|identify|idle|ignore|ill|illegal|illness|image|imitate|immense|immune|impact|impose|improve|impulse|inch|include|income|increase|index|indicate|indoor|industry|infant|inflict|inform|inhale|inherit|initial|inject|injury|inmate|inner|innocent|input|inquiry|insane|insect|inside|inspire|install|intact|interest|into|invest|invite|involve|iron|island|isolate|issue|item|ivory|jacket|jaguar|jar|jazz|jealous|jeans|jelly|jewel|job|join|joke|journey|joy|judge|juice|jump|jungle|junior|junk|just|kangaroo|keen|keep|ketchup|key|kick|kid|kidney|kind|kingdom|kiss|kit|kitchen|kite|kitten|kiwi|knee|knife|knock|know|lab|label|labor|ladder|lady|lake|lamp|language|laptop|large|later|latin|laugh|laundry|lava|law|lawn|lawsuit|layer|lazy|leader|leaf|learn|leave|lecture|left|leg|legal|legend|leisure|lemon|lend|length|lens|leopard|lesson|letter|level|liar|liberty|library|license|life|lift|light|like|limb|limit|link|lion|liquid|list|little|live|lizard|load|loan|lobster|local|lock|logic|lonely|long|loop|lottery|loud|lounge|love|loyal|lucky|luggage|lumber|lunar|lunch|luxury|lyrics|machine|mad|magic|magnet|maid|mail|main|major|make|mammal|man|manage|mandate|mango|mansion|manual|maple|marble|march|margin|marine|market|marriage|mask|mass|master|match|material|math|matrix|matter|maximum|maze|meadow|mean|measure|meat|mechanic|medal|media|melody|melt|member|memory|mention|menu|mercy|merge|merit|merry|mesh|message|metal|method|middle|midnight|milk|million|mimic|mind|minimum|minor|minute|miracle|mirror|misery|miss|mistake|mix|mixed|mixture|mobile|model|modify|mom|moment|monitor|monkey|monster|month|moon|moral|more|morning|mosquito|mother|motion|motor|mountain|mouse|move|movie|much|muffin|mule|multiply|muscle|museum|mushroom|music|must|mutual|myself|mystery|myth|naive|name|napkin|narrow|nasty|nation|nature|near|neck|need|negative|neglect|neither|nephew|nerve|nest|net|network|neutral|never|news|next|nice|night|noble|noise|nominee|noodle|normal|north|nose|notable|note|nothing|notice|novel|now|nuclear|number|nurse|nut|oak|obey|object|oblige|obscure|observe|obtain|obvious|occur|ocean|october|odor|off|offer|office|often|oil|okay|old|olive|olympic|omit|once|one|onion|online|only|open|opera|opinion|oppose|option|orange|orbit|orchard|order|ordinary|organ|orient|original|orphan|ostrich|other|outdoor|outer|output|outside|oval|oven|over|own|owner|oxygen|oyster|ozone|pact|paddle|page|pair|palace|palm|panda|panel|panic|panther|paper|parade|parent|park|parrot|party|pass|patch|path|patient|patrol|pattern|pause|pave|payment|peace|peanut|pear|peasant|pelican|pen|penalty|pencil|people|pepper|perfect|permit|person|pet|phone|photo|phrase|physical|piano|picnic|picture|piece|pig|pigeon|pill|pilot|pink|pioneer|pipe|pistol|pitch|pizza|place|planet|plastic|plate|play|please|pledge|pluck|plug|plunge|poem|poet|point|polar|pole|police|pond|pony|pool|popular|portion|position|possible|post|potato|pottery|poverty|powder|power|practice|praise|predict|prefer|prepare|present|pretty|prevent|price|pride|primary|print|priority|prison|private|prize|problem|process|produce|profit|program|project|promote|proof|property|prosper|protect|proud|provide|public|pudding|pull|pulp|pulse|pumpkin|punch|pupil|puppy|purchase|purity|purpose|purse|push|put|puzzle|pyramid|quality|quantum|quarter|question|quick|quit|quiz|quote|rabbit|raccoon|race|rack|radar|radio|rail|rain|raise|rally|ramp|ranch|random|range|rapid|rare|rate|rather|raven|raw|razor|ready|real|reason|rebel|rebuild|recall|receive|recipe|record|recycle|reduce|reflect|reform|refuse|region|regret|regular|reject|relax|release|relief|rely|remain|remember|remind|remove|render|renew|rent|reopen|repair|repeat|replace|report|require|rescue|resemble|resist|resource|response|result|retire|retreat|return|reunion|reveal|review|reward|rhythm|rib|ribbon|rice|rich|ride|ridge|rifle|right|rigid|ring|riot|ripple|risk|ritual|rival|river|road|roast|robot|robust|rocket|romance|roof|rookie|room|rose|rotate|rough|round|route|royal|rubber|rude|rug|rule|run|runway|rural|sad|saddle|sadness|safe|sail|salad|salmon|salon|salt|salute|same|sample|sand|satisfy|satoshi|sauce|sausage|save|say|scale|scan|scare|scatter|scene|scheme|school|science|scissors|scorpion|scout|scrap|screen|script|scrub|sea|search|season|seat|second|secret|section|security|seed|seek|segment|select|sell|seminar|senior|sense|sentence|series|service|session|settle|setup|seven|shadow|shaft|shallow|share|shed|shell|sheriff|shield|shift|shine|ship|shiver|shock|shoe|shoot|shop|short|shoulder|shove|shrimp|shrug|shuffle|shy|sibling|sick|side|siege|sight|sign|silent|silk|silly|silver|similar|simple|since|sing|siren|sister|situate|six|size|skate|sketch|ski|skill|skin|skirt|skull|slab|slam|sleep|slender|slice|slide|slight|slim|slogan|slot|slow|slush|small|smart|smile|smoke|smooth|snack|snake|snap|sniff|snow|soap|soccer|social|sock|soda|soft|solar|soldier|solid|solution|solve|someone|song|soon|sorry|sort|soul|sound|soup|source|south|space|spare|spatial|spawn|speak|special|speed|spell|spend|sphere|spice|spider|spike|spin|spirit|split|spoil|sponsor|spoon|sport|spot|spray|spread|spring|spy|square|squeeze|squirrel|stable|stadium|staff|stage|stairs|stamp|stand|start|state|stay|steak|steel|stem|step|stereo|stick|still|sting|stock|stomach|stone|stool|story|stove|strategy|street|strike|strong|struggle|student|stuff|stumble|style|subject|submit|subway|success|such|sudden|suffer|sugar|suggest|suit|summer|sun|sunny|sunset|super|supply|supreme|sure|surface|surge|surprise|surround|survey|suspect|sustain|swallow|swamp|swap|swarm|swear|sweet|swift|swim|swing|switch|sword|symbol|symptom|syrup|system|table|tackle|tag|tail|talent|talk|tank|tape|target|task|taste|tattoo|taxi|teach|team|tell|ten|tenant|tennis|tent|term|test|text|thank|that|theme|then|theory|there|they|thing|this|thought|three|thrive|throw|thumb|thunder|ticket|tide|tiger|tilt|timber|time|tiny|tip|tired|tissue|title|toast|tobacco|today|toddler|toe|together|toilet|token|tomato|tomorrow|tone|tongue|tonight|tool|tooth|top|topic|topple|torch|tornado|tortoise|toss|total|tourist|toward|tower|town|toy|track|trade|traffic|tragic|train|transfer|trap|trash|travel|tray|treat|tree|trend|trial|tribe|trick|trigger|trim|trip|trophy|trouble|truck|true|truly|trumpet|trust|truth|try|tube|tuition|tumble|tuna|tunnel|turkey|turn|turtle|twelve|twenty|twice|twin|twist|two|type|typical|ugly|umbrella|unable|unaware|uncle|uncover|under|undo|unfair|unfold|unhappy|uniform|unique|unit|universe|unknown|unlock|until|unusual|unveil|update|upgrade|uphold|upon|upper|upset|urban|urge|usage|use|used|useful|useless|usual|utility|vacant|vacuum|vague|valid|valley|valve|van|vanish|vapor|various|vast|vault|vehicle|velvet|vendor|venture|venue|verb|verify|version|very|vessel|veteran|viable|vibrant|vicious|victory|video|view|village|vintage|violin|virtual|virus|visa|visit|visual|vital|vivid|vocal|voice|void|volcano|volume|vote|voyage|wage|wagon|wait|walk|wall|walnut|want|warfare|warm|warrior|wash|wasp|waste|water|wave|way|wealth|weapon|wear|weasel|weather|web|wedding|weekend|weird|welcome|west|wet|whale|what|wheat|wheel|when|where|whip|whisper|wide|width|wife|wild|will|win|window|wine|wing|wink|winner|winter|wire|wisdom|wise|wish|witness|wolf|woman|wonder|wood|wool|word|work|world|worry|worth|wrap|wreck|wrestle|wrist|write|wrong|yard|year|yellow|you|young|youth|zebra|zero|zone|zoo'.split('|');

  const INVALID_MNEMONIC = 'Invalid mnemonic';
  const INVALID_ENTROPY = 'Invalid entropy';
  const INVALID_CHECKSUM = 'Invalid mnemonic checksum';
  function normalize(str) {
    return (str || '').normalize('NFKD');
  }
  function binaryToByte(bin) {
    return parseInt(bin, 2);
  }
  function bytesToBinary(bytes) {
    return bytes.map(x => x.toString(2).padStart(8, '0')).join('');
  }
  function deriveChecksumBits(entropyBuffer) {
    return bytesToBinary(Array.from(sha256AsU8a(entropyBuffer))).slice(0, entropyBuffer.length * 8 / 32);
  }
  function mnemonicToSeedSync(mnemonic, password) {
    return pbkdf2Encode(util.stringToU8a(normalize(mnemonic)), util.stringToU8a(`mnemonic${normalize(password)}`)).password;
  }
  function mnemonicToEntropy$1(mnemonic) {
    var _entropyBits$match;
    const words = normalize(mnemonic).split(' ');
    util.assert(words.length % 3 === 0, INVALID_MNEMONIC);
    const bits = words.map(word => {
      const index = DEFAULT_WORDLIST.indexOf(word);
      util.assert(index !== -1, INVALID_MNEMONIC);
      return index.toString(2).padStart(11, '0');
    }).join('');
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
    const entropyBytes = (_entropyBits$match = entropyBits.match(/(.{1,8})/g)) === null || _entropyBits$match === void 0 ? void 0 : _entropyBits$match.map(binaryToByte);
    util.assert(entropyBytes && entropyBytes.length % 4 === 0 && entropyBytes.length >= 16 && entropyBytes.length <= 32, INVALID_ENTROPY);
    const entropy = util.u8aToU8a(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    util.assert(newChecksum === checksumBits, INVALID_CHECKSUM);
    return entropy;
  }
  function entropyToMnemonic(entropy) {
    util.assert(entropy.length % 4 === 0 && entropy.length >= 16 && entropy.length <= 32, INVALID_ENTROPY);
    const entropyBits = bytesToBinary(Array.from(entropy));
    const checksumBits = deriveChecksumBits(entropy);
    return (entropyBits + checksumBits).match(/(.{1,11})/g).map(binary => DEFAULT_WORDLIST[binaryToByte(binary)]).join(' ');
  }
  function generateMnemonic(strength) {
    strength = strength || 128;
    util.assert(strength % 32 === 0, INVALID_ENTROPY);
    return entropyToMnemonic(randomAsU8a(strength / 8));
  }
  function validateMnemonic(mnemonic) {
    try {
      mnemonicToEntropy$1(mnemonic);
    } catch (e) {
      return false;
    }
    return true;
  }

  const STRENGTH_MAP = {
    12: 16 * 8,
    15: 20 * 8,
    18: 24 * 8,
    21: 28 * 8,
    24: 32 * 8
  };
  function mnemonicGenerate(numWords = 12, onlyJs) {
    return !util.hasBigInt || !onlyJs && isReady() ? bip39Generate(numWords) : generateMnemonic(STRENGTH_MAP[numWords]);
  }

  function mnemonicToEntropy(mnemonic, onlyJs) {
    return !util.hasBigInt || !onlyJs && isReady() ? bip39ToEntropy(mnemonic) : mnemonicToEntropy$1(mnemonic);
  }

  function mnemonicValidate(mnemonic, onlyJs) {
    return !util.hasBigInt || !onlyJs && isReady() ? bip39Validate(mnemonic) : validateMnemonic(mnemonic);
  }

  function mnemonicToLegacySeed(mnemonic, password = '', onlyJs, byteLength = 32) {
    util.assert(mnemonicValidate(mnemonic), 'Invalid bip39 mnemonic specified');
    util.assert([32, 64].includes(byteLength), () => `Invalid seed length ${byteLength}, expected 32 or 64`);
    return byteLength === 32 ? !util.hasBigInt || !onlyJs && isReady() ? bip39ToSeed(mnemonic, password) : mnemonicToSeedSync(mnemonic, password).subarray(0, 32) : mnemonicToSeedSync(mnemonic, password);
  }

  function mnemonicToMiniSecret(mnemonic, password = '', onlyJs) {
    util.assert(mnemonicValidate(mnemonic), 'Invalid bip39 mnemonic specified');
    if (!onlyJs && isReady()) {
      return bip39ToMiniSecret(mnemonic, password);
    }
    const entropy = mnemonicToEntropy(mnemonic);
    const salt = util.stringToU8a(`mnemonic${password}`);
    return pbkdf2Encode(entropy, salt).password.slice(0, 32);
  }

  function ledgerDerivePrivate(xprv, index) {
    const kl = xprv.subarray(0, 32);
    const kr = xprv.subarray(32, 64);
    const cc = xprv.subarray(64, 96);
    const data = util.u8aConcat([0], kl, kr, util.bnToU8a(index, BN_LE_32_OPTS));
    const z = hmacShaAsU8a(cc, data, 512);
    data[0] = 0x01;
    return util.u8aConcat(util.bnToU8a(util.u8aToBn(kl, BN_LE_OPTS).iadd(util.u8aToBn(z.subarray(0, 28), BN_LE_OPTS).imul(util.BN_EIGHT)), BN_LE_512_OPTS).subarray(0, 32), util.bnToU8a(util.u8aToBn(kr, BN_LE_OPTS).iadd(util.u8aToBn(z.subarray(32, 64), BN_LE_OPTS)), BN_LE_512_OPTS).subarray(0, 32), hmacShaAsU8a(cc, data, 512).subarray(32, 64));
  }

  const ED25519_CRYPTO = 'ed25519 seed';
  function ledgerMaster(mnemonic, password) {
    const seed = mnemonicToSeedSync(mnemonic, password);
    const chainCode = hmacShaAsU8a(ED25519_CRYPTO, new Uint8Array([1, ...seed]), 256);
    let priv;
    while (!priv || priv[31] & 0b00100000) {
      priv = hmacShaAsU8a(ED25519_CRYPTO, priv || seed, 512);
    }
    priv[0] &= 0b11111000;
    priv[31] &= 0b01111111;
    priv[31] |= 0b01000000;
    return util.u8aConcat(priv, chainCode);
  }

  function hdLedger(_mnemonic, path) {
    const words = _mnemonic.split(' ').map(s => s.trim()).filter(s => s);
    util.assert([12, 24, 25].includes(words.length), 'Expected a mnemonic with 24 words (or 25 including a password)');
    const [mnemonic, password] = words.length === 25 ? [words.slice(0, 24).join(' '), words[24]] : [words.join(' '), ''];
    util.assert(mnemonicValidate(mnemonic), 'Invalid mnemonic passed to ledger derivation');
    util.assert(hdValidatePath(path), 'Invalid derivation path');
    const parts = path.split('/').slice(1);
    let seed = ledgerMaster(mnemonic, password);
    for (const p of parts) {
      const n = parseInt(p.replace(/'$/, ''), 10);
      seed = ledgerDerivePrivate(seed, n < HARDENED ? n + HARDENED : n);
    }
    return ed25519PairFromSeed(seed.slice(0, 32));
  }

  function naclDecrypt(encrypted, nonce, secret) {
    return nacl.secretbox.open(encrypted, nonce, secret) || null;
  }

  function naclEncrypt(message, secret, nonce = randomAsU8a(24)) {
    return {
      encrypted: nacl.secretbox(message, nonce, secret),
      nonce
    };
  }

  function naclBoxPairFromSecret(secret) {
    return nacl.box.keyPair.fromSecretKey(secret.slice(0, 32));
  }

  function naclOpen(sealed, nonce, senderBoxPublic, receiverBoxSecret) {
    return nacl.box.open(sealed, nonce, senderBoxPublic, receiverBoxSecret) || null;
  }

  function naclSeal(message, senderBoxSecret, receiverBoxPublic, nonce = randomAsU8a(24)) {
    return {
      nonce,
      sealed: nacl.box(message, nonce, receiverBoxPublic, senderBoxSecret)
    };
  }

  const rotl$1 = (a, b) => (a << b) | (a >>> (32 - b));
  function XorAndSalsa(prev, pi, input, ii, out, oi) {
      let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
      let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
      let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
      let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
      let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
      let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
      let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
      let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
      let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
      for (let i = 0; i < 8; i += 2) {
          x04 ^= rotl$1(x00 + x12 | 0, 7);
          x08 ^= rotl$1(x04 + x00 | 0, 9);
          x12 ^= rotl$1(x08 + x04 | 0, 13);
          x00 ^= rotl$1(x12 + x08 | 0, 18);
          x09 ^= rotl$1(x05 + x01 | 0, 7);
          x13 ^= rotl$1(x09 + x05 | 0, 9);
          x01 ^= rotl$1(x13 + x09 | 0, 13);
          x05 ^= rotl$1(x01 + x13 | 0, 18);
          x14 ^= rotl$1(x10 + x06 | 0, 7);
          x02 ^= rotl$1(x14 + x10 | 0, 9);
          x06 ^= rotl$1(x02 + x14 | 0, 13);
          x10 ^= rotl$1(x06 + x02 | 0, 18);
          x03 ^= rotl$1(x15 + x11 | 0, 7);
          x07 ^= rotl$1(x03 + x15 | 0, 9);
          x11 ^= rotl$1(x07 + x03 | 0, 13);
          x15 ^= rotl$1(x11 + x07 | 0, 18);
          x01 ^= rotl$1(x00 + x03 | 0, 7);
          x02 ^= rotl$1(x01 + x00 | 0, 9);
          x03 ^= rotl$1(x02 + x01 | 0, 13);
          x00 ^= rotl$1(x03 + x02 | 0, 18);
          x06 ^= rotl$1(x05 + x04 | 0, 7);
          x07 ^= rotl$1(x06 + x05 | 0, 9);
          x04 ^= rotl$1(x07 + x06 | 0, 13);
          x05 ^= rotl$1(x04 + x07 | 0, 18);
          x11 ^= rotl$1(x10 + x09 | 0, 7);
          x08 ^= rotl$1(x11 + x10 | 0, 9);
          x09 ^= rotl$1(x08 + x11 | 0, 13);
          x10 ^= rotl$1(x09 + x08 | 0, 18);
          x12 ^= rotl$1(x15 + x14 | 0, 7);
          x13 ^= rotl$1(x12 + x15 | 0, 9);
          x14 ^= rotl$1(x13 + x12 | 0, 13);
          x15 ^= rotl$1(x14 + x13 | 0, 18);
      }
      out[oi++] = (y00 + x00) | 0;
      out[oi++] = (y01 + x01) | 0;
      out[oi++] = (y02 + x02) | 0;
      out[oi++] = (y03 + x03) | 0;
      out[oi++] = (y04 + x04) | 0;
      out[oi++] = (y05 + x05) | 0;
      out[oi++] = (y06 + x06) | 0;
      out[oi++] = (y07 + x07) | 0;
      out[oi++] = (y08 + x08) | 0;
      out[oi++] = (y09 + x09) | 0;
      out[oi++] = (y10 + x10) | 0;
      out[oi++] = (y11 + x11) | 0;
      out[oi++] = (y12 + x12) | 0;
      out[oi++] = (y13 + x13) | 0;
      out[oi++] = (y14 + x14) | 0;
      out[oi++] = (y15 + x15) | 0;
  }
  function BlockMix(input, ii, out, oi, r) {
      let head = oi + 0;
      let tail = oi + 16 * r;
      for (let i = 0; i < 16; i++)
          out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
      for (let i = 0; i < r; i++, head += 16, ii += 16) {
          XorAndSalsa(out, tail, input, ii, out, head);
          if (i > 0)
              tail += 16;
          XorAndSalsa(out, head, input, (ii += 16), out, tail);
      }
  }
  function scryptInit(password, salt, _opts) {
      const opts = checkOpts({
          dkLen: 32,
          asyncTick: 10,
          maxmem: 1024 ** 3 + 1024,
      }, _opts);
      const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
      assertNumber(N);
      assertNumber(r);
      assertNumber(p);
      assertNumber(dkLen);
      assertNumber(asyncTick);
      assertNumber(maxmem);
      if (onProgress !== undefined && typeof onProgress !== 'function')
          throw new Error('progressCb should be function');
      const blockSize = 128 * r;
      const blockSize32 = blockSize / 4;
      if (N <= 1 || (N & (N - 1)) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) {
          throw new Error('Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32');
      }
      if (p < 0 || p > ((2 ** 32 - 1) * 32) / blockSize) {
          throw new Error('Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)');
      }
      if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) {
          throw new Error('Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32');
      }
      const memUsed = blockSize * (N + p);
      if (memUsed > maxmem) {
          throw new Error(`Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`);
      }
      const B = pbkdf2(sha256, password, salt, { c: 1, dkLen: blockSize * p });
      const B32 = u32(B);
      const V = u32(new Uint8Array(blockSize * N));
      const tmp = u32(new Uint8Array(blockSize));
      let blockMixCb = () => { };
      if (onProgress) {
          const totalBlockMix = 2 * N * p;
          const callbackPer = Math.max(Math.floor(totalBlockMix / 10000), 1);
          let blockMixCnt = 0;
          blockMixCb = () => {
              blockMixCnt++;
              if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
                  onProgress(blockMixCnt / totalBlockMix);
          };
      }
      return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
  }
  function scryptOutput(password, dkLen, B, V, tmp) {
      const res = pbkdf2(sha256, password, B, { c: 1, dkLen });
      B.fill(0);
      V.fill(0);
      tmp.fill(0);
      return res;
  }
  function scrypt(password, salt, opts) {
      const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
      for (let pi = 0; pi < p; pi++) {
          const Pi = blockSize32 * pi;
          for (let i = 0; i < blockSize32; i++)
              V[i] = B32[Pi + i];
          for (let i = 0, pos = 0; i < N - 1; i++) {
              BlockMix(V, pos, V, (pos += blockSize32), r);
              blockMixCb();
          }
          BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
          blockMixCb();
          for (let i = 0; i < N; i++) {
              const j = B32[Pi + blockSize32 - 16] % N;
              for (let k = 0; k < blockSize32; k++)
                  tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
              BlockMix(tmp, 0, B32, Pi, r);
              blockMixCb();
          }
      }
      return scryptOutput(password, dkLen, B, V, tmp);
  }

  const DEFAULT_PARAMS = {
    N: 1 << 15,
    p: 1,
    r: 8
  };

  function scryptEncode(passphrase, salt = randomAsU8a(), params = DEFAULT_PARAMS, onlyJs) {
    const u8a = util.u8aToU8a(passphrase);
    return {
      params,
      password: !util.hasBigInt || !onlyJs && isReady() ? scrypt$1(u8a, salt, Math.log2(params.N), params.r, params.p) : scrypt(u8a, salt, util.objectSpread({
        dkLen: 64
      }, params)),
      salt
    };
  }

  function scryptFromU8a(data) {
    const salt = data.subarray(0, 32);
    const N = util.u8aToBn(data.subarray(32 + 0, 32 + 4), BN_LE_OPTS).toNumber();
    const p = util.u8aToBn(data.subarray(32 + 4, 32 + 8), BN_LE_OPTS).toNumber();
    const r = util.u8aToBn(data.subarray(32 + 8, 32 + 12), BN_LE_OPTS).toNumber();
    util.assert(N === DEFAULT_PARAMS.N && p === DEFAULT_PARAMS.p && r === DEFAULT_PARAMS.r, 'Invalid injected scrypt params found');
    return {
      params: {
        N,
        p,
        r
      },
      salt
    };
  }

  function scryptToU8a(salt, {
    N,
    p,
    r
  }) {
    return util.u8aConcat(salt, util.bnToU8a(N, BN_LE_32_OPTS), util.bnToU8a(p, BN_LE_32_OPTS), util.bnToU8a(r, BN_LE_32_OPTS));
  }

  const ENCODING = ['scrypt', 'xsalsa20-poly1305'];
  const ENCODING_NONE = ['none'];
  const ENCODING_VERSION = '3';
  const NONCE_LENGTH = 24;
  const SCRYPT_LENGTH = 32 + 3 * 4;

  function jsonDecryptData(encrypted, passphrase, encType = ENCODING) {
    util.assert(encrypted, 'No encrypted data available to decode');
    util.assert(passphrase || !encType.includes('xsalsa20-poly1305'), 'Password required to decode encrypted data');
    let encoded = encrypted;
    if (passphrase) {
      let password;
      if (encType.includes('scrypt')) {
        const {
          params,
          salt
        } = scryptFromU8a(encrypted);
        password = scryptEncode(passphrase, salt, params).password;
        encrypted = encrypted.subarray(SCRYPT_LENGTH);
      } else {
        password = util.stringToU8a(passphrase);
      }
      encoded = naclDecrypt(encrypted.subarray(NONCE_LENGTH), encrypted.subarray(0, NONCE_LENGTH), util.u8aFixLength(password, 256, true));
    }
    util.assert(encoded, 'Unable to decode using the supplied passphrase');
    return encoded;
  }

  function jsonDecrypt({
    encoded,
    encoding
  }, passphrase) {
    util.assert(encoded, 'No encrypted data available to decode');
    return jsonDecryptData(util.isHex(encoded) ? util.hexToU8a(encoded) : base64Decode(encoded), passphrase, Array.isArray(encoding.type) ? encoding.type : [encoding.type]);
  }

  function jsonEncryptFormat(encoded, contentType, isEncrypted) {
    return {
      encoded: base64Encode(encoded),
      encoding: {
        content: contentType,
        type: isEncrypted ? ENCODING : ENCODING_NONE,
        version: ENCODING_VERSION
      }
    };
  }

  function jsonEncrypt(data, contentType, passphrase) {
    let isEncrypted = false;
    let encoded = data;
    if (passphrase) {
      const {
        params,
        password,
        salt
      } = scryptEncode(passphrase);
      const {
        encrypted,
        nonce
      } = naclEncrypt(encoded, password.subarray(0, 32));
      isEncrypted = true;
      encoded = util.u8aConcat(scryptToU8a(salt, params), nonce, encrypted);
    }
    return jsonEncryptFormat(encoded, contentType, isEncrypted);
  }

  const secp256k1VerifyHasher = hashType => (message, signature, publicKey) => secp256k1Verify(message, signature, publicKey, hashType);
  const VERIFIERS_ECDSA = [['ecdsa', secp256k1VerifyHasher('blake2')], ['ethereum', secp256k1VerifyHasher('keccak')]];
  const VERIFIERS = [['ed25519', ed25519Verify], ['sr25519', sr25519Verify], ...VERIFIERS_ECDSA];
  const CRYPTO_TYPES = ['ed25519', 'sr25519', 'ecdsa'];
  function verifyDetect(result, {
    message,
    publicKey,
    signature
  }, verifiers = VERIFIERS) {
    result.isValid = verifiers.some(([crypto, verify]) => {
      try {
        if (verify(message, signature, publicKey)) {
          result.crypto = crypto;
          return true;
        }
      } catch (error) {
      }
      return false;
    });
    return result;
  }
  function verifyMultisig(result, {
    message,
    publicKey,
    signature
  }) {
    util.assert([0, 1, 2].includes(signature[0]), () => `Unknown crypto type, expected signature prefix [0..2], found ${signature[0]}`);
    const type = CRYPTO_TYPES[signature[0]] || 'none';
    result.crypto = type;
    try {
      result.isValid = {
        ecdsa: () => verifyDetect(result, {
          message,
          publicKey,
          signature: signature.subarray(1)
        }, VERIFIERS_ECDSA).isValid,
        ed25519: () => ed25519Verify(message, signature.subarray(1), publicKey),
        none: () => {
          throw Error('no verify for `none` crypto type');
        },
        sr25519: () => sr25519Verify(message, signature.subarray(1), publicKey)
      }[type]();
    } catch (error) {
    }
    return result;
  }
  function getVerifyFn(signature) {
    return [0, 1, 2].includes(signature[0]) && [65, 66].includes(signature.length) ? verifyMultisig : verifyDetect;
  }
  function signatureVerify(message, signature, addressOrPublicKey) {
    const signatureU8a = util.u8aToU8a(signature);
    util.assert([64, 65, 66].includes(signatureU8a.length), () => `Invalid signature length, expected [64..66] bytes, found ${signatureU8a.length}`);
    const publicKey = decodeAddress(addressOrPublicKey);
    const input = {
      message: util.u8aToU8a(message),
      publicKey,
      signature: signatureU8a
    };
    const result = {
      crypto: 'none',
      isValid: false,
      isWrapped: util.u8aIsWrapped(input.message, true),
      publicKey
    };
    const isWrappedBytes = util.u8aIsWrapped(input.message, false);
    const verifyFn = getVerifyFn(signatureU8a);
    verifyFn(result, input);
    if (result.crypto !== 'none' || result.isWrapped && !isWrappedBytes) {
      return result;
    }
    input.message = isWrappedBytes ? util.u8aUnwrapBytes(input.message) : util.u8aWrapBytes(input.message);
    return verifyFn(result, input);
  }

  const P64_1 = BigInt$1('11400714785074694791');
  const P64_2 = BigInt$1('14029467366897019727');
  const P64_3 = BigInt$1('1609587929392839161');
  const P64_4 = BigInt$1('9650029242287828579');
  const P64_5 = BigInt$1('2870177450012600261');
  const U64 = BigInt$1('0xffffffffffffffff');
  const _7n = BigInt$1(7);
  const _11n = BigInt$1(11);
  const _12n = BigInt$1(12);
  const _16n = BigInt$1(16);
  const _18n = BigInt$1(18);
  const _23n = BigInt$1(23);
  const _27n = BigInt$1(27);
  const _29n = BigInt$1(29);
  const _31n = BigInt$1(31);
  const _32n = BigInt$1(32);
  const _33n = BigInt$1(33);
  const _64n = BigInt$1(64);
  const _256n = BigInt$1(256);
  function rotl(a, b) {
    const c = a & U64;
    return (c << b | c >> _64n - b) & U64;
  }
  function fromU8a(u8a, p, count) {
    const bigints = new Array(count);
    let offset = 0;
    for (let i = 0; i < count; i++, offset += 2) {
      bigints[i] = BigInt$1(u8a[p + offset] | u8a[p + 1 + offset] << 8);
    }
    let result = util._0n;
    for (let i = count - 1; i >= 0; i--) {
      result = (result << _16n) + bigints[i];
    }
    return result;
  }
  function toU8a(h64) {
    const result = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      result[i] = Number(h64 % _256n);
      h64 = h64 / _256n;
    }
    return result;
  }
  function state(initSeed) {
    const seed = BigInt$1(initSeed);
    return {
      seed,
      u8a: new Uint8Array(32),
      u8asize: 0,
      v1: seed + P64_1 + P64_2,
      v2: seed + P64_2,
      v3: seed,
      v4: seed - P64_1
    };
  }
  function init(state, input) {
    if (input.length < 32) {
      state.u8a.set(input);
      state.u8asize = input.length;
      return state;
    }
    const limit = input.length - 32;
    let p = 0;
    if (limit >= 0) {
      const adjustV = v => P64_1 * rotl(v + P64_2 * fromU8a(input, p, 4), _31n);
      do {
        state.v1 = adjustV(state.v1);
        p += 8;
        state.v2 = adjustV(state.v2);
        p += 8;
        state.v3 = adjustV(state.v3);
        p += 8;
        state.v4 = adjustV(state.v4);
        p += 8;
      } while (p <= limit);
    }
    if (p < input.length) {
      state.u8a.set(input.subarray(p, input.length));
      state.u8asize = input.length - p;
    }
    return state;
  }
  function xxhash64(input, initSeed) {
    const {
      seed,
      u8a,
      u8asize,
      v1,
      v2,
      v3,
      v4
    } = init(state(initSeed), input);
    let p = 0;
    let h64 = U64 & BigInt$1(input.length) + (input.length >= 32 ? ((((rotl(v1, util._1n) + rotl(v2, _7n) + rotl(v3, _12n) + rotl(v4, _18n) ^ P64_1 * rotl(v1 * P64_2, _31n)) * P64_1 + P64_4 ^ P64_1 * rotl(v2 * P64_2, _31n)) * P64_1 + P64_4 ^ P64_1 * rotl(v3 * P64_2, _31n)) * P64_1 + P64_4 ^ P64_1 * rotl(v4 * P64_2, _31n)) * P64_1 + P64_4 : seed + P64_5);
    while (p <= u8asize - 8) {
      h64 = U64 & P64_4 + P64_1 * rotl(h64 ^ P64_1 * rotl(P64_2 * fromU8a(u8a, p, 4), _31n), _27n);
      p += 8;
    }
    if (p + 4 <= u8asize) {
      h64 = U64 & P64_3 + P64_2 * rotl(h64 ^ P64_1 * fromU8a(u8a, p, 2), _23n);
      p += 4;
    }
    while (p < u8asize) {
      h64 = U64 & P64_1 * rotl(h64 ^ P64_5 * BigInt$1(u8a[p++]), _11n);
    }
    h64 = U64 & P64_2 * (h64 ^ h64 >> _33n);
    h64 = U64 & P64_3 * (h64 ^ h64 >> _29n);
    return toU8a(U64 & (h64 ^ h64 >> _32n));
  }

  function xxhashAsU8a(data, bitLength = 64, onlyJs) {
    const rounds = Math.ceil(bitLength / 64);
    const u8a = util.u8aToU8a(data);
    if (!util.hasBigInt || !onlyJs && isReady()) {
      return twox(u8a, rounds);
    }
    const result = new Uint8Array(rounds * 8);
    for (let seed = 0; seed < rounds; seed++) {
      result.set(xxhash64(u8a, seed).reverse(), seed * 8);
    }
    return result;
  }
  const xxhashAsHex = createAsHex(xxhashAsU8a);

  exports.addressEq = addressEq;
  exports.addressToEvm = addressToEvm;
  exports.allNetworks = allNetworks;
  exports.availableNetworks = availableNetworks;
  exports.base32Decode = base32Decode;
  exports.base32Encode = base32Encode;
  exports.base32Validate = base32Validate;
  exports.base58Decode = base58Decode;
  exports.base58Encode = base58Encode;
  exports.base58Validate = base58Validate;
  exports.base64Decode = base64Decode;
  exports.base64Encode = base64Encode;
  exports.base64Pad = base64Pad;
  exports.base64Trim = base64Trim;
  exports.base64Validate = base64Validate;
  exports.blake2AsHex = blake2AsHex;
  exports.blake2AsU8a = blake2AsU8a;
  exports.checkAddress = checkAddress;
  exports.checkAddressChecksum = checkAddressChecksum;
  exports.convertPublicKeyToCurve25519 = convertPublicKeyToCurve25519;
  exports.convertSecretKeyToCurve25519 = convertSecretKeyToCurve25519;
  exports.createKeyDerived = createKeyDerived;
  exports.createKeyMulti = createKeyMulti;
  exports.cryptoIsReady = cryptoIsReady;
  exports.cryptoWaitReady = cryptoWaitReady;
  exports.decodeAddress = decodeAddress;
  exports.deriveAddress = deriveAddress;
  exports.ed25519DeriveHard = ed25519DeriveHard;
  exports.ed25519PairFromRandom = ed25519PairFromRandom;
  exports.ed25519PairFromSecret = ed25519PairFromSecret;
  exports.ed25519PairFromSeed = ed25519PairFromSeed;
  exports.ed25519PairFromString = ed25519PairFromString;
  exports.ed25519Sign = ed25519Sign;
  exports.ed25519Verify = ed25519Verify;
  exports.encodeAddress = encodeAddress;
  exports.encodeDerivedAddress = encodeDerivedAddress;
  exports.encodeMultiAddress = encodeMultiAddress;
  exports.ethereumEncode = ethereumEncode;
  exports.evmToAddress = evmToAddress;
  exports.hdEthereum = hdEthereum;
  exports.hdLedger = hdLedger;
  exports.hdValidatePath = hdValidatePath;
  exports.hmacSha256AsU8a = hmacSha256AsU8a;
  exports.hmacSha512AsU8a = hmacSha512AsU8a;
  exports.hmacShaAsU8a = hmacShaAsU8a;
  exports.isAddress = isAddress;
  exports.isBase32 = isBase32;
  exports.isBase58 = isBase58;
  exports.isBase64 = isBase64;
  exports.isEthereumAddress = isEthereumAddress;
  exports.isEthereumChecksum = isEthereumChecksum;
  exports.jsonDecrypt = jsonDecrypt;
  exports.jsonDecryptData = jsonDecryptData;
  exports.jsonEncrypt = jsonEncrypt;
  exports.jsonEncryptFormat = jsonEncryptFormat;
  exports.keccak256AsU8a = keccak256AsU8a;
  exports.keccak512AsU8a = keccak512AsU8a;
  exports.keccakAsHex = keccakAsHex;
  exports.keccakAsU8a = keccakAsU8a;
  exports.keyExtractPath = keyExtractPath;
  exports.keyExtractSuri = keyExtractSuri;
  exports.keyFromPath = keyFromPath;
  exports.keyHdkdEcdsa = keyHdkdEcdsa;
  exports.keyHdkdEd25519 = keyHdkdEd25519;
  exports.keyHdkdSr25519 = keyHdkdSr25519;
  exports.mnemonicGenerate = mnemonicGenerate;
  exports.mnemonicToEntropy = mnemonicToEntropy;
  exports.mnemonicToLegacySeed = mnemonicToLegacySeed;
  exports.mnemonicToMiniSecret = mnemonicToMiniSecret;
  exports.mnemonicValidate = mnemonicValidate;
  exports.naclBoxPairFromSecret = naclBoxPairFromSecret;
  exports.naclDecrypt = naclDecrypt;
  exports.naclEncrypt = naclEncrypt;
  exports.naclOpen = naclOpen;
  exports.naclSeal = naclSeal;
  exports.packageInfo = packageInfo;
  exports.pbkdf2Encode = pbkdf2Encode;
  exports.randomAsHex = randomAsHex;
  exports.randomAsNumber = randomAsNumber;
  exports.randomAsU8a = randomAsU8a;
  exports.scryptEncode = scryptEncode;
  exports.scryptFromU8a = scryptFromU8a;
  exports.scryptToU8a = scryptToU8a;
  exports.secp256k1Compress = secp256k1Compress;
  exports.secp256k1Expand = secp256k1Expand;
  exports.secp256k1PairFromSeed = secp256k1PairFromSeed;
  exports.secp256k1PrivateKeyTweakAdd = secp256k1PrivateKeyTweakAdd;
  exports.secp256k1Recover = secp256k1Recover;
  exports.secp256k1Sign = secp256k1Sign;
  exports.secp256k1Verify = secp256k1Verify;
  exports.selectableNetworks = selectableNetworks;
  exports.setSS58Format = setSS58Format;
  exports.sha256AsU8a = sha256AsU8a;
  exports.sha512AsU8a = sha512AsU8a;
  exports.shaAsU8a = shaAsU8a;
  exports.signatureVerify = signatureVerify;
  exports.sortAddresses = sortAddresses;
  exports.sr25519Agreement = sr25519Agreement;
  exports.sr25519DeriveHard = sr25519DeriveHard;
  exports.sr25519DerivePublic = sr25519DerivePublic;
  exports.sr25519DeriveSoft = sr25519DeriveSoft;
  exports.sr25519PairFromSeed = sr25519PairFromSeed;
  exports.sr25519Sign = sr25519Sign;
  exports.sr25519Verify = sr25519Verify;
  exports.sr25519VrfSign = sr25519VrfSign;
  exports.sr25519VrfVerify = sr25519VrfVerify;
  exports.validateAddress = validateAddress;
  exports.xxhashAsHex = xxhashAsHex;
  exports.xxhashAsU8a = xxhashAsU8a;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
