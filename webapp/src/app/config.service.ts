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

  public readonly DataProviders = List.of(
    {
      datasetURL: new URL(`${datasetBaseURL}/1`),
      datasetTypesURL: new URL(`${datasetBaseURL}/1_types`),
      identity: new cothority.network.ServerIdentity({
        address: "tcp://data-provider-1:1234",
        public: Buffer.concat([
          kyber.pairing.point.BN256G1Point.MARSHAL_ID,
          Buffer.from(
            "084d56ecfe11f5879e78195d90579d7f80be518f14ab0c0c46d82fcb223652bf843699a62acc86ae1613cd4ea530486aeeef1016302f1116fb7a5d70615dba8b",
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
            "4e8070296168a55866a12d2cd7dac4eab8cdf633d6e4f410a79e1e1e44a166b20b63d38823d8be259a9a18f0c646e963340868af41eef9383a2824eb5da178c8",
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
            "6ad6addf63dfe841d7042dfcd082602cd02ef10e50a314c33c1bc3eb501fba0d052aeb991111dae85a97aaa716a8d44a9a8a9d8b71e52c25491b2307abdef3d6",
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
        "77f4237da9b62f2096ebd178038bd754d924fe9434367827b718d700953b7be27ad7428ef9bd6248e4f258cbc3ca2955c10f028e0b92676ef1499f91e4ebd4ec",
        "hex"
      ),
    ]),
  });
}
