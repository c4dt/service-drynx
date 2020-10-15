import * as Cothority from "@dedis/cothority";

import * as lib from "../src";

import * as network from "./helpers/network";

describe("client", function () {
  beforeEach(network.start);
  afterEach(network.stop);

  xit("connects to server", async function () {
    const nodes = network.getNodes();
    const client = new lib.Client(nodes[0].url);

    // TODO wugly
    const cn = nodes[0].identity;
    const dps = nodes.slice(1).map((dp) => dp.identity);

    const idtopublic: { [_: string]: Buffer } = {};
    for (const node of nodes) {
      idtopublic[node.identity.toString()] = node.identity.public;
    }

    const ret = await client.run(
      new lib.SurveyQuery({
        surveyid: "test-query",
        query: new lib.Query({
          selector: ["col1"],
          operation: new lib.Operation({ nameop: "sum" }),
        }),

        rosterservers: new Cothority.network.Roster({
          list: [cn, dps[0], dps[1]],
        }),
        servertodp: {
          [cn.address]: new lib.ServerIdentityList({ content: dps }),
        },
        idtopublic,
      })
    );
    console.log(ret);
  });
});
