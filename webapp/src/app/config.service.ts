import { Injectable } from '@angular/core'

import * as cothority from '@dedis/cothority'
import * as kyber from '@dedis/kyber'

const datasetBaseURL = 'http://10.90.47.29:17253'

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public readonly ClientURL = new URL('ws://10.90.47.29:21047')

  public readonly DataProviders = [{
    datasetURL: new URL(`${datasetBaseURL}/1`),
    datasetTypesURL: new URL(`${datasetBaseURL}/1_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://10.233.110.26:1234',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('10a0b188fe473478fe9ba75cc2a3cc9d16cd2fffe5afd50aa446c4a4b6a947021220ab4553c89c3d1719f5281b4b8b617dcb7d10f8392ea552dd5fc45305d76f', 'hex')])
    })
  }, {
    datasetURL: new URL(`${datasetBaseURL}/2`),
    datasetTypesURL: new URL(`${datasetBaseURL}/2_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://10.233.80.108:1234',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('31aa1f16b7094e491be5459464300b99c50899e72c21478a93b41bf980763ea12f6fb8ab9affd7f2519b00f8581d7d1dabe666e0c1c705ced777558b18b53e3c', 'hex')])
    })
  }, {
    datasetURL: new URL(`${datasetBaseURL}/3`),
    datasetTypesURL: new URL(`${datasetBaseURL}/3_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://10.233.123.194:1234',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('79b364b4991dd3721edb94f4c5b1d54ad1fd95086370c48c3849115d46399ff28ccdcd9a78e9f4a084069d4762c89ae71037c4b23af0e880280565a11c6693a4', 'hex')])
    })
  }]

  public readonly ComputingNode = this.DataProviders[0].identity
}
