import {BN256G1Point} from '@dedis/kyber/pairing/point';
import BN256Scalar from '@dedis/kyber/pairing/scalar';
// @ts-ignore
import {randomBytes} from "crypto-browserify";
import {PointFactory, Point, Scalar} from "@dedis/kyber";

import { Suite } from "./suite";
import { CipherText } from "./conv";
import {Map} from 'immutable';

/**
 * Holds a keypair of a scalar/point pair, where the point is the scalar * Base,
 * which corresponds most of the time to a private/public keypair.
 */
export class KeyPair {
	point: Point;

	constructor(public readonly scalar: Scalar) {
		this.point = new BN256G1Point();
		const base = new BN256G1Point().base();
		this.point.mul(scalar, base);
	}

	static random(): KeyPair {
		return new KeyPair(new BN256Scalar().pick());
	}
}


/**
 * Return from the encrypted method including the random factor.
 */
interface Encrypted {
	CT: CipherText;
	r: Scalar;
}

/**
 * Basic LibDrynx methods that can be used to encrypt and decrypt values.
 */
export class Crypto {
	static readonly maxInt = 10000;

	private computed: Map<Point, number>;

	constructor() {
		this.computed = Map();
	}

	/**
	 * Encrypts an integer so that it can be used in homomorphic operations.
	 * @param pub
	 * @param i
	 */
	encryptInt(pub: Point, i: number): CipherText {
		const point = Crypto.intToPoint(i);
		this.computed = this.computed.set(point, i);

		const enc = Crypto.encryptPoint(pub, point);
		return enc.CT;
	}

	/**
	 * Decrypts the integer found in the point. As the final step of the decryption
	 * involves solving the discreet log problem, it will only solve for integers < maxInt.
	 * @param priv
	 * @param cipher
	 * @param checkNeg
	 */
	decryptInt(priv: Scalar, cipher: CipherText, checkNeg: boolean = false): number {
		const point = Crypto.decryptPoint(priv, cipher);
		const found = this.computed.get(point)
		if (found !== undefined)
			return found;

		const ret = Crypto.pointtoInt(point, checkNeg);
		this.computed = this.computed.set(point, ret);

		return ret;
	}

	/**
	 * ElGamal encryption of a message that has been mapped to a point m.
	 * @param pub
	 * @param m
	 */
	static encryptPoint(pub: Point, m: Point): Encrypted {
		const B = Suite.point().base();
		const r = Suite.scalar().pick((l: number) => randomBytes(l));
		const k = Suite.point().mul(r, B);
		const S = Suite.point().mul(r, pub);
		const c = Suite.point().add(S, m);

		return {CT: new CipherText({ k: k.toProto(), c: c.toProto() }), r};
	}

	/**
	 * ElGamal decryption.
	 * @param priv
	 * @param c
	 */
	static decryptPoint(priv: Scalar, cipher: CipherText): Point {
		if (cipher.k === undefined || cipher.c === undefined)
			throw new Error("badly defined CipherText")
		const k = PointFactory.fromProto(cipher.k);
		const c = PointFactory.fromProto(cipher.c);

		const S = Suite.point().mul(priv, k);
		return Suite.point().sub(c, S);
	}

	/**
	 * Paillier encryption (at least I think so ;) of a number to let it be used in
	 * homomorphic operations.
	 * @param n
	 */
	static intToPoint(n: number): Point {
		const neg = n < 0;
		if (neg){
			n = n * -1;
		}
		const i64 = Buffer.alloc(8);
		i64.writeInt32BE(n, 4);
		const i = Suite.scalar().setBytes(Buffer.from(i64));
		if (neg){
			i.neg(i);
		}
		return Suite.point().mul(i, Suite.point().base());
	}

	/**
	 * This solves the discreet log problem by simply trying out all scalar values in
	 * ascending value.
	 * If checkNeg is true, it tries to find the number in a zig-zag way: 0, 1, -1, 2, -2, ...
	 * TODO: add a static table to speed up lookups of known numbers.
	 * @param p
	 * @param checkNeg
	 */
	static pointtoInt(toReverse: Point, checkNeg: boolean): number {
		const base = Suite.point().base();
		const zero = Suite.scalar().zero();
		const one = Suite.scalar().one();

		const one_point = Suite.point().mul(one, base);

		let guess = Suite.point().mul(zero, base);
		for (let i = 0; i <= this.maxInt; i++, guess.add(guess, one_point)) {
			if (toReverse.equals(guess))
				return i;

			if (checkNeg) {
				// TODO double negation
				guess.neg(guess)
				if (toReverse.equals(guess))
					return -i;
				guess.neg(guess);
			}
		}

		throw new Error("didn't find discrete log");
	}
}
