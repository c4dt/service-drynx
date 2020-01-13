import * as Cothority from '@dedis/cothority'
import { addJSON } from '@dedis/cothority/protobuf' // dedis/cothority#2154

import { SurveyQuery, ResponseDP } from './conv'
import { KeyPair, Crypto } from './crypto'
import proto from './proto.json'

export class Client {
  private readonly connection: Cothority.network.connection.WebSocketConnection;
  private readonly keys: KeyPair;
  private readonly crypto: Crypto;

  constructor (url: URL) {
    addJSON(proto)
    SurveyQuery.register()
    ResponseDP.register()

    let trimmedURL = url.href
    if (trimmedURL.endsWith('/')) {
      trimmedURL = trimmedURL.slice(0, trimmedURL.length - 1)
    }
    this.connection = new Cothority.network.connection.WebSocketConnection(trimmedURL, 'drynx')

    this.keys = KeyPair.random()
    this.crypto = new Crypto()
  }

  async run (sq: SurveyQuery): Promise<number[]> {
    sq.clientpubkey = this.keys.point.marshalBinary()

    const ret = await this.connection.send<ResponseDP>(sq, ResponseDP)
    if (ret.data === undefined) {
      throw new Error('no results')
    }

    const groups = Object.values(ret.data)
    if (groups.length !== 1) {
      throw new Error('single group expected')
    }
    const vector = groups[0]
    if (vector.content === undefined) {
      throw new Error('group without results')
    }

    return vector.content.map(text => {
      if (text.c === undefined || text.k === undefined) {
        throw new Error('an encrypted vector element is missing required fields')
      }

      return this.crypto.decryptInt(this.keys.scalar, text)
    })
  }
}
