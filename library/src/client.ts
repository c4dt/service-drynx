import * as Cothority from '@dedis/cothority'
import { addJSON } from '@dedis/cothority/protobuf' // dedis/cothority#2154

import { SurveyQuery, ResponseDP } from './conv'
import { KeyPair, Crypto } from './crypto'
import proto from './proto.json'
import { List } from 'immutable'

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

    const keys = KeyPair.random()
    this.crypto = new Crypto(keys)
    this.keys = keys
  }

  async run (sq: SurveyQuery): Promise<List<number>> {
    if (sq.query === undefined) {
      throw new Error('no query defined')
    }
    if (sq.query.operation === undefined) {
      throw new Error('no operation defined')
    }

    const isStdDev = sq.query.operation.nameop === 'standard deviation'
    if (isStdDev) {
      sq.query.operation.nameop = 'variance'
    }

    sq.clientpubkey = this.keys.point.marshalBinary()

    const ret = await this.connection.send<ResponseDP>(sq, ResponseDP)
    if (ret.data === undefined) {
      throw new Error('no results')
    }

    if (isStdDev) {
      sq.query.operation.nameop = 'standard deviation'
    }

    const groups = Object.values(ret.data)
    if (groups.length !== 1) {
      throw new Error('single group expected')
    }
    const vector = groups[0]
    if (vector.content === undefined) {
      throw new Error('group without results')
    }

    const results = vector.content.map(text => {
      if (text.c === undefined || text.k === undefined) {
        throw new Error('an encrypted vector element is missing required fields')
      }

      const decrypted = this.crypto.decryptInt(text)
      if (decrypted === undefined) {
        throw new Error('unable to decrypt result')
      }

      return decrypted
    })

    if (sq.query.operation.nameop === 'mean') {
      if (results.length !== 2) {
        throw new Error('wrong shape of results')
      }

      return List.of(results[0] / results[1])
    }

    if (sq.query.operation.nameop === 'variance' || isStdDev) {
      if (results.length !== 3) {
        throw new Error('wrong shape of results')
      }

      const mean = (results[0] / results[1])
      const variance = results[2] / results[1] - mean * mean

      if (isStdDev) {
        return List.of(Math.sqrt(variance))
      }
      return List.of(variance)
    }

    return List(results)
  }
}
