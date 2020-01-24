import { Injectable } from '@angular/core'

import * as cothority from '@dedis/cothority'
import * as kyber from '@dedis/kyber'

const datasetBaseURL = 'https://demo.c4dt.org/drynx/datasets'

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public readonly ClientURL = new URL('ws://demo.c4dt.org/drynx/node')
  public readonly TotalRowCount = 30

  public readonly DataProviders = [{
    datasetURL: new URL(`${datasetBaseURL}/1`),
    datasetTypesURL: new URL(`${datasetBaseURL}/1_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://localhost:1234',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('502a8582994626225d2e04031522b104003534507796bec0ce91846a7ab5505750f692f0bbc15bab0e4be77b7950feb06cc3ef9c0954b7a5cd18c5541d5f743d', 'hex')])
    })
  }, {
    datasetURL: new URL(`${datasetBaseURL}/2`),
    datasetTypesURL: new URL(`${datasetBaseURL}/2_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://localhost:1236',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('2e8bb550b30ca511162745bde6311eba7439c94a12f7406c369c704cdb326dbe28a04fd054a66a50d8189f93e8a55b5896371759b43c4cf02af109a6c8564b3a', 'hex')])
    })
  }, {
    datasetURL: new URL(`${datasetBaseURL}/3`),
    datasetTypesURL: new URL(`${datasetBaseURL}/3_types`),
    identity: new cothority.network.ServerIdentity({
      address: 'tcp://localhost:1238',
      public: Buffer.concat([
        kyber.pairing.point.BN256G1Point.MARSHAL_ID,
        Buffer.from('79cca3dac2ed903e324a72d036210a329dfcc4418721687eb0007f5a09777b991bae1916e8ba7602cf0cc09b0ac530371db584545ea09b23101b3d9f59b82e57', 'hex')])
    })
  }]

  public readonly ComputingNode = this.DataProviders[0].identity
}
