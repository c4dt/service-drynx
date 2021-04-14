import { List } from "immutable";
import { Injectable } from "@angular/core";

import * as cothority from "@dedis/cothority";
import * as kyber from "@dedis/kyber";

let locationStripped = globalThis.location.href;
if (locationStripped.endsWith("/"))
  locationStripped = locationStripped.substr(0, locationStripped.length - 1);
const datasetBaseURL = `${locationStripped}/datasets`;

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  public readonly ClientURL = new URL(
    `${locationStripped.replace(/^http/, "ws")}/leader`
  );
  public readonly TotalRowCount = 30;

  public readonly ByzCoin = {
    ID: Buffer.from(
      "9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3",
      "hex"
    ),
    URL: new URL("wss://conode.c4dt.org:7771"),
  };

  public readonly DataProviders = List.of(
    {
      datasetURL: new URL(`${datasetBaseURL}/1`),
      datasetTypesURL: new URL(`${datasetBaseURL}/1_types`),
      identity: new cothority.network.ServerIdentity({
        address: "tcp://data-provider-1:1234",
        public: Buffer.concat([
          kyber.pairing.point.BN256G1Point.MARSHAL_ID,
          Buffer.from(
            "502a8582994626225d2e04031522b104003534507796bec0ce91846a7ab5505750f692f0bbc15bab0e4be77b7950feb06cc3ef9c0954b7a5cd18c5541d5f743d",
            "hex"
          ),
        ]),
      }),
    },
    {
      datasetURL: new URL(`${datasetBaseURL}/2`),
      datasetTypesURL: new URL(`${datasetBaseURL}/2_types`),
      identity: new cothority.network.ServerIdentity({
        address: "tcp://data-provider-2:1236",
        public: Buffer.concat([
          kyber.pairing.point.BN256G1Point.MARSHAL_ID,
          Buffer.from(
            "2e8bb550b30ca511162745bde6311eba7439c94a12f7406c369c704cdb326dbe28a04fd054a66a50d8189f93e8a55b5896371759b43c4cf02af109a6c8564b3a",
            "hex"
          ),
        ]),
      }),
    },
    {
      datasetURL: new URL(`${datasetBaseURL}/3`),
      datasetTypesURL: new URL(`${datasetBaseURL}/3_types`),
      identity: new cothority.network.ServerIdentity({
        address: "tcp://data-provider-3:1238",
        public: Buffer.concat([
          kyber.pairing.point.BN256G1Point.MARSHAL_ID,
          Buffer.from(
            "79cca3dac2ed903e324a72d036210a329dfcc4418721687eb0007f5a09777b991bae1916e8ba7602cf0cc09b0ac530371db584545ea09b23101b3d9f59b82e57",
            "hex"
          ),
        ]),
      }),
    }
  );

  public readonly ComputingNode = new cothority.network.ServerIdentity({
    address: "tcp://computing-node:4320",
    public: Buffer.concat([
      kyber.pairing.point.BN256G1Point.MARSHAL_ID,
      Buffer.from(
        "08588c22f9758797d2bac23aed6182ad23a1ad5c8be0b1529e300ef07ee132ce55fe3cbdae8d62ecdd23b7ce10fda9e1c294b3094af16c3b874ab0f38245b2b7",
        "hex"
      ),
    ]),
  });
}
