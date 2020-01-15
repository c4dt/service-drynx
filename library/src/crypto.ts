import { BN256G1Point } from '@dedis/kyber/pairing/point'
import BN256Scalar from '@dedis/kyber/pairing/scalar'
// @ts-ignore
import { randomBytes } from 'crypto-browserify'
import { PointFactory, Point, Scalar } from '@dedis/kyber'

import * as Suite from './suite'
import { CipherText } from './conv'
import { Map } from 'immutable'

/**
 * Holds a keypair of a scalar/point pair, where the point is the scalar * Base,
 * which corresponds most of the time to a private/public keypair.
 */
export class KeyPair {
  readonly point: Point

  constructor (public readonly scalar: Scalar) {
    this.point = new BN256G1Point()
    const base = new BN256G1Point().base()
    this.point.mul(scalar, base)
  }

  static random (): KeyPair {
    return new KeyPair(new BN256Scalar().pick())
  }
}

/**
 * Return from the encrypted method including the random factor.
 */
interface Encrypted {
  CT: CipherText
  r: Scalar
}

/**
 * Basic LibDrynx methods that can be used to encrypt and decrypt values.
 */
export class Crypto {
  static readonly maxInt = 20000

  // Point.toString -> decrypted
  private computed: Map<string, number>

  constructor (
    private readonly keypair: KeyPair
  ) {
    this.computed = Map()
  }

  /**
   * Encrypts an integer so that it can be used in homomorphic operations.
   * @param pub
   * @param i
   */
  encryptInt (i: number): CipherText {
    const point = Crypto.intToPoint(i)
    this.computed = this.computed.set(point.toString(), i)

    const enc = this.encryptPoint(point)
    return enc.CT
  }

  /**
   * Decrypts the integer found in the point. As the final step of the decryption
   * involves solving the discreet log problem, it will only solve for integers < maxInt.
   * @param priv
   * @param cipher
   * @param checkNeg
   */
  decryptInt (cipher: CipherText, checkNeg: boolean = false): number {
    const point = this.decryptPoint(cipher)
    const found = this.computed.get(point.toString())
    if (found !== undefined) {
      return found
    }

    const ret = Crypto.pointtoInt(point, checkNeg)
    this.computed = this.computed.set(point.toString(), ret)

    return ret
  }

  /**
   * ElGamal encryption of a message that has been mapped to a point m.
   * @param pub
   * @param m
   */
  encryptPoint (m: Point): Encrypted {
    const B = Suite.point().base()
    const r = Suite.scalar().pick((l: number) => randomBytes(l))
    const k = Suite.point().mul(r, B)
    const S = Suite.point().mul(r, this.keypair.point)
    const c = Suite.point().add(S, m)

    return { CT: new CipherText({ k: k.toProto(), c: c.toProto() }), r }
  }

  /**
   * ElGamal decryption.
   * @param priv
   * @param c
   */
  decryptPoint (cipher: CipherText): Point {
    if (cipher.k === undefined || cipher.c === undefined) {
      throw new Error('badly defined CipherText')
    }
    const k = PointFactory.fromProto(cipher.k)
    const c = PointFactory.fromProto(cipher.c)

    const S = Suite.point().mul(this.keypair.scalar, k)
    return Suite.point().sub(c, S)
  }

  /**
   * Paillier encryption (at least I think so ;) of a number to let it be used in
   * homomorphic operations.
   * @param n
   */
  static intToPoint (n: number): Point {
    const neg = n < 0
    if (neg) {
      n = n * -1
    }
    const i64 = Buffer.alloc(8)
    i64.writeInt32BE(n, 4)
    const i = Suite.scalar().setBytes(Buffer.from(i64))
    if (neg) {
      i.neg(i)
    }
    return Suite.point().mul(i, Suite.point().base())
  }

  /**
   * This solves the discreet log problem by simply trying out all scalar values in
   * ascending value.
   * If checkNeg is true, it tries to find the number in a zig-zag way: 0, 1, -1, 2, -2, ...
   * @param p
   * @param checkNeg
   */
  static pointtoInt (toReverse: Point, checkNeg: boolean): number {
    const base = Suite.point().base()
    const zero = Suite.scalar().zero()
    const one = Suite.scalar().one()

    const onePoint = Suite.point().mul(one, base)

    const guess = Suite.point().mul(zero, base)
    for (let i = 0; i <= this.maxInt; i++, guess.add(guess, onePoint)) {
      if (toReverse.equals(guess)) {
        return i
      }

      if (checkNeg) {
        // TODO double negation
        guess.neg(guess)
        if (toReverse.equals(guess)) {
          return -i
        }
        guess.neg(guess)
      }
    }

    throw new Error("didn't find discrete log")
  }
}
