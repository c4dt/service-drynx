import { Injectable } from '@angular/core';

import * as cothority from "@dedis/cothority";
import * as kyber from "@dedis/kyber";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
	public readonly ClientURL = new URL(`ws://${location.hostname}:1235`);

	public readonly ComputingNode = new cothority.network.ServerIdentity({
		public: Buffer.concat([
			kyber.pairing.point.BN256G1Point.MARSHAL_ID,
			Buffer.from("3b44ee5d76acde1206fa1dab49fa168cd3fa2beb6b8da2a8c26b278dcd94b9b276585b6c050557d31f6776a31f88124778c47fe157d126e2de149b7eef122b01", "hex")]),
		address: `tcp://${location.hostname}:1234`,
	});
	public readonly DataProviders = [{
			datasetURL: new URL("dataset/1236", location.href),
			identity: new cothority.network.ServerIdentity({
				address: `tcp://${location.hostname}:1236`,
				public: Buffer.concat([
					kyber.pairing.point.BN256G1Point.MARSHAL_ID,
					Buffer.from("8baeec0eb207908255fb0685050dec08e0cb45bb0174d49a541971edd19d03fa14742f7614651019579b06f334c13f1e9158d67ca0e00db6fe7e831642917f3c", "hex")]),
		})}, {
			datasetURL: new URL("dataset/1238", location.href),
			identity: new cothority.network.ServerIdentity({
				address: `tcp://${location.hostname}:1238`,
				public: Buffer.concat([
					kyber.pairing.point.BN256G1Point.MARSHAL_ID,
					Buffer.from("4900e8a533a8266439096b06d84defe7eea7183177ce0b454523b1c71a3531d9680a4baf087aff52587eb23e26196bdfb7e60146ac7ad906b43c0949fa82d9c1", "hex")]),
		})},
	]
}
