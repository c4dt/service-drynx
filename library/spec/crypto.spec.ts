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
    for (const ii of [0, 1, 12, 123, 1234]) {
      const i = Math.floor(ii)
      const enc = Crypto.intToPoint(i)
      const dec = Crypto.pointtoInt(enc, false)
      expect(dec).toBe(i)
    }
  })

  it('should solve the discreet log problem for negative numbers', () => {
    for (const ii of [0, 1, 12, 123, 1234]) {
      const i = Math.floor(ii)
      const enc = Crypto.intToPoint(i)
      const dec = Crypto.pointtoInt(enc, true)
      expect(dec).toBe(i)
    }
  })

  it('should crypt and decrypt a point', () => {
    const kp = KeyPair.random()
    const crypto = new Crypto(kp)
    const p = Suite.point().pick()

    const enc = crypto.encryptPoint(p)
    const dec = crypto.decryptPoint(enc.CT)

    expect(p.equals(dec)).toBeTrue()
  })

  it('should crypt and decrypt an integer', () => {
    const kp = KeyPair.random()
    const crypto = new Crypto(kp)
    for (const ii of [0, 1, 12, 123, 1234]) {
      const iint = Math.floor(ii)
      for (const i of [iint, -iint]) {
        const enc = crypto.encryptInt(i)
        const dec = crypto.decryptInt(enc, true)
        expect(dec).toBe(i)
      }
    }
  })

  it('should keep already computed decryption', () => {
    const kp = KeyPair.random()
    const i = 123

    let crypto = new Crypto(kp)
    const enc = crypto.encryptInt(i)
    crypto = new Crypto(kp)

    const firstDecryptStart = Date.now()
    crypto.decryptInt(enc)
    const firstDecryptDuration = Date.now() - firstDecryptStart

    const secondDecryptStart = Date.now()
    crypto.decryptInt(enc)
    const secondDecryptDuration = Date.now() - secondDecryptStart

    expect(secondDecryptDuration).toBeLessThan(firstDecryptDuration)
  })
})
