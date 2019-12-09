import { Set } from "immutable";

import Cothority from "@dedis/cothority";

export type Node = Cothority.network.ServerIdentity;

export class Network {
	constructor(
		public readonly client: URL,
		public readonly nodes: Set<Node>,
	) {}
}
