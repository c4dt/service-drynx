import assert from 'assert'
import { List } from 'immutable'
import gauss from 'gaussian-elimination'

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

    switch (sq.query.operation.nameop) {
      case 'mean':
        if (results.length !== 2) {
          throw new Error('wrong shape of results')
        }
        return List.of(results[0] / results[1])
      case 'standard deviation':
      case 'variance': {
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
      case 'lin_reg': {
        const d = Math.round((-5 + Math.sqrt(5 * 5 - 4 * (4 - 2 * results.length))) / 2)
        if (d < 1) {
          throw new Error()
        }

        // TODO ugly, taken from golang

        const matrixAugmented: number[][] = new Array(d + 1)
        for (let i = 0; i < matrixAugmented.length; i++) {
          matrixAugmented[i] = new Array(d + 2)
        }

        let s = 0
        let l = d + 1
        let k = d + 1
        let i = 0
        for (let j = 0; j < results.length - d - 1; j++) {
          if (j === l) {
            k--
            l = l + k
            i++
            s = 0
          }
          matrixAugmented[i][i + s] = results[j]
          if (i !== i + s) {
            matrixAugmented[i + s][i] = results[j]
          }
          s++
        }

        for (let j = results.length - d - 1; j < results.length; j++) {
          matrixAugmented[j - results.length + d + 1][d + 1] = results[j]
        }

        return List(gauss(matrixAugmented))
      }
    }

    return List(results)
  }
}
