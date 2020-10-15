import { spawn, ChildProcess } from "child_process";
import { createConnection } from "net";

import * as cothority from "@dedis/cothority";
import kyber from "@dedis/kyber";

const hostname = "localhost";
const nodeCount = 3;

const portBase = Math.round(1024 + Math.random() * (2 ** 16 - 1024));

let nodes: undefined | Node[];

async function runUntilEnd(p: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    p.on("error", reject);
    p.on("exit", (code, signal) => {
      if (code !== null && code !== 0) {
        reject(new Error(`exited with ${code}`));
      }
      if (signal !== null) {
        reject(new Error(`signaled with ${signal}`));
      }
      resolve();
    });
  });
}

async function waitUntilConnectable(port: number): Promise<void> {
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const socket = createConnection(port, hostname);
        socket.on("connect", resolve);
        socket.on("error", reject);
      });
    } catch (e) {
      // TODO correct hostname
      if (e.message === `connect ECONNREFUSED 127.0.0.1:${port}`) {
        continue;
      }
      throw e;
    }

    return;
  }
}

function extractFromConf(conf: string): Buffer {
  const privmatched = conf.match(/^\s*Private\s*=\s*'([0-9a-z]+)'\s*$/m);
  if (privmatched === null) {
    throw new Error("unable to find private key in generated config");
  }

  const matched = conf.match(/^\s*Public\s*=\s*'([0-9a-z]+)'\s*$/m);
  if (matched === null) {
    throw new Error("unable to find public key in generated config");
  }

  return Buffer.concat([
    kyber.pairing.point.BN256G1Point.MARSHAL_ID, // TODO ugly
    Buffer.from(matched[1], "hex"),
  ]);
}

async function startNode(
  portServer: number,
  portClient: number
): Promise<Node> {
  portServer = Math.round(portServer);
  portClient = Math.round(portClient);

  const gen = spawn(
    "server",
    ["new", `${hostname}:${portServer}`, `${hostname}:${portClient}`],
    { stdio: ["ignore", "pipe", "inherit"] }
  );

  const conf: Promise<Buffer> = new Promise((resolve, reject) => {
    gen.on("error", reject);
    let acc = Buffer.alloc(0);
    gen.stdout.on("data", (chunk) => {
      acc = Buffer.concat([acc, chunk]);
    });
    gen.stdout.on("end", () => resolve(acc));
  });

  await runUntilEnd(gen);

  const providing = spawn("server", ["data-provider", "new", "random"], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  const computing = spawn("server", ["computing-node", "new"], {
    stdio: [providing.stdout, "pipe", "inherit"],
  });
  const verifying = spawn("server", ["verifying-node", "new"], {
    stdio: [computing.stdout, "pipe", "inherit"],
  });
  const run = spawn("server", ["run"], {
    stdio: [verifying.stdout, "inherit", "inherit"],
  });

  providing.stdin.end(await conf);
  for (const p of [providing, computing, verifying]) {
    await runUntilEnd(p);
  }

  await waitUntilConnectable(portClient);

  const publicKey = extractFromConf((await conf).toString());
  const url = new URL(`http://${hostname}:${portClient}`);
  const id = new cothority.network.ServerIdentity({
    // TODO ugly
    public: publicKey,
    address: `tcp://${hostname}:${portServer}`,
  });
  return new Node(url, id, run);
}

export class Node {
  private readonly exited: Promise<void>;

  constructor(
    public readonly url: URL,
    public readonly identity: cothority.network.ServerIdentity,
    private readonly process: ChildProcess // TODO move inside
  ) {
    this.exited = new Promise((resolve, reject) => {
      process.on("error", reject);
      process.on("exit", (code, signal) => {
        if (code !== null && code !== 0) {
          reject(new Error(`exited with ${code}`));
        }
        if (signal !== null) {
          reject(new Error(`signaled with ${signal}`));
        }
        resolve();
      });
    });
  }

  async kill(): Promise<void> {
    this.process.kill();
    await this.exited.catch((e) => {
      if (e.message !== "signaled with SIGTERM") {
        throw e;
      }
    });
  }
}

export function getNodes(): Node[] {
  if (nodes === undefined) {
    throw new Error("asking nodes of non-running network");
  }

  return nodes;
}

export async function start(): Promise<void> {
  if (nodes !== undefined) {
    throw new Error("starting an already running network");
  }

  const started = [];
  for (let i = 0; i < nodeCount; i++) {
    const node = await startNode(portBase + i * 2, portBase + i * 2 + 1);
    started.push(node);
  }

  nodes = started;
}

export async function stop(): Promise<void> {
  if (nodes === undefined) {
    throw new Error("stopping non-running network");
  }

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  await Promise.all(nodes.map((node) => node.kill()));
}
