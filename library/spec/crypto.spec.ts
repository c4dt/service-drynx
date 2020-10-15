import * as Suite from "../src/suite";
import { KeyPair, Crypto, Range } from "../src/crypto";
import { CipherText } from "../src/conv";

describe("pairing", function () {
  it("should create keypair", () => {
    const kp1 = KeyPair.random();
    const kp2 = KeyPair.random();
    expect(kp1.scalar.equals(kp2.scalar)).toBeFalse();
    expect(kp1.point.equals(kp2.point)).toBeFalse();

    const s = Suite.scalar().add(kp1.scalar, kp2.scalar);
    const p = Suite.point().add(kp1.point, kp2.point);
    const pp = Suite.point().mul(s, Suite.point().base());
    expect(pp.equals(p)).toBeTruthy();
  });

  it("should crypt and decrypt an integer", () => {
    const kp = KeyPair.random();
    const cryptor = new Crypto(kp);
    const decryptor = new Crypto(kp);

    for (const ii of [0, 1, 12, 123, 1234]) {
      const iint = Math.floor(ii);
      for (const i of [iint, -iint]) {
        const enc = cryptor.encryptInt(i);
        const dec = decryptor.decryptInt(enc, new Range(-12345, 12345));
        expect(dec).toBe(i);
      }
    }
  });

  function testDecryptWithWarmer(
    warmer: (crypto: Crypto, clear: number, encrypted: CipherText) => void
  ): void {
    const kp = KeyPair.random();
    const i = 123;

    let crypto = new Crypto(kp);
    const enc = crypto.encryptInt(i);

    crypto = new Crypto(kp);
    const coldDecryptStart = Date.now();
    const coldDecrypted = crypto.decryptInt(enc);
    const coldDecryptDuration = Date.now() - coldDecryptStart;
    expect(coldDecrypted).toBe(i);

    crypto = new Crypto(kp);
    warmer(crypto, i, enc);
    const warmDecryptStart = Date.now();
    const warmDecrypted = crypto.decryptInt(enc);
    const warmDecryptDuration = Date.now() - warmDecryptStart;
    expect(warmDecrypted).toBe(i);

    expect(warmDecryptDuration).toBeLessThan(coldDecryptDuration);
  }

  it("should keep already computed decryption, with decryptInt", () => {
    testDecryptWithWarmer((crypto, _, enc) => {
      crypto.decryptInt(enc);
    });
  });

  it("should keep already computed decryption, with warmDecryption", () => {
    testDecryptWithWarmer((crypto, clear) => {
      crypto.warmDecryption(new Range(-clear, clear));
    });
  });

  it("should restart from already computed", () => {
    const kp = KeyPair.random();
    const i = 123;

    let crypto = new Crypto(kp);
    const enc = crypto.encryptInt(i);
    crypto = new Crypto(kp);

    const coldDecryptStart = Date.now();
    const coldDecrypted = crypto.decryptInt(enc, new Range(0, i - 1));
    const coldDecryptDuration = Date.now() - coldDecryptStart;
    expect(coldDecrypted).toBeUndefined();

    const warmDecryptStart = Date.now();
    const warmDecrypted = crypto.decryptInt(enc, new Range(0, i));
    const warmDecryptDuration = Date.now() - warmDecryptStart;
    expect(warmDecrypted).toBe(i);

    expect(warmDecryptDuration).toBeLessThan(coldDecryptDuration);
  });
});
