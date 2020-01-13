import * as kyber from '@dedis/kyber'

export function point (): kyber.Point {
  return new kyber.pairing.point.BN256G1Point()
}

export function scalar (): kyber.Scalar {
  return new kyber.pairing.BN256Scalar()
}
