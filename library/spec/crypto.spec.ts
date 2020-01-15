import * as Suite from '../src/suite'
import { KeyPair, Crypto } from '../src/crypto'

describe('pairing', function () {
  it('should create keypair', () => {
    const kp1 = KeyPair.random()
    const kp2 = KeyPair.random()
    expect(kp1.scalar.equals(kp2.scalar)).toBeFalse()
    expect(kp1.point.equals(kp2.point)).toBeFalse()

    const s = Suite.scalar().add(kp1.scalar, kp2.scalar)
    const p = Suite.point().add(kp1.point, kp2.point)
    const pp = Suite.point().mul(s, Suite.point().base())
    expect(pp.equals(p)).toBeTruthy()
  })

  it('should solve the discreet log problem for positive numbers', () => {
    const mi = Crypto.maxInt
    for (const ii of [0, 1, mi / 2, mi / 3]) {
      const i = Math.floor(ii)
      const enc = Crypto.intToPoint(i)
      const dec = Crypto.pointtoInt(enc, false)
      expect(i).toBe(dec)
    }
  })

  it('should solve the discreet log problem for negative numbers', () => {
    const mi = Crypto.maxInt
    for (const ii of [0, -1, -mi / 2, -mi / 3]) {
      const i = Math.floor(ii)
      const enc = Crypto.intToPoint(i)
      const dec = Crypto.pointtoInt(enc, true)
      expect(i).toBe(dec)
    }
  })

  it('should crypt and decrypt a point', () => {
    const kp = KeyPair.random()
    const p = Suite.point().pick()
    const enc = Crypto.encryptPoint(kp.point, p)
    const dec = Crypto.decryptPoint(kp.scalar, enc.CT)
    expect(dec.equals(p)).toBeTrue()
  })

  it('should crypt and decrypt an integer', () => {
    const kp = KeyPair.random()
    const mi = Crypto.maxInt
    const crypto = new Crypto()
    for (const ii of [0, 1, mi / 2, mi / 3]) {
      const iint = Math.floor(ii)
      for (const i of [iint, -iint]) {
        const enc = crypto.encryptInt(kp.point, i)
        const dec = crypto.decryptInt(kp.scalar, enc, true)
        expect(dec).toBe(i)
      }
    }
  })

  it('should keep already computed decryption', () => {
    const kp = KeyPair.random()
    const i = 123

    let crypto = new Crypto()
    const enc = crypto.encryptInt(kp.point, i)
    crypto = new Crypto()

    const firstDecryptStart = Date.now()
    crypto.decryptInt(kp.scalar, enc)
    const firstDecryptDuration = Date.now() - firstDecryptStart

    const secondDecryptStart = Date.now()
    crypto.decryptInt(kp.scalar, enc)
    const secondDecryptDuration = Date.now() - secondDecryptStart

    expect(secondDecryptDuration).toBeLessThan(firstDecryptDuration)
  })
})
