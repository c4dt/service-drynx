import * as kyber from "@dedis/kyber";

export class Suite {
    static point(): kyber.Point {
        return new kyber.pairing.point.BN256G1Point;
    }

    static scalar(): kyber.Scalar {
        return new kyber.pairing.BN256Scalar();
    }
}
