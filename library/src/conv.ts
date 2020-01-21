import { Message } from 'protobufjs/light'

import * as Cothority from '@dedis/cothority'
import { registerMessage } from '@dedis/cothority/protobuf' // dedis/cothority#2154

export type ColumnID = string

class PublishSignatureBytes extends Message<PublishSignatureBytes> {
  static register (): void {
    registerMessage('PublishSignatureBytes', PublishSignatureBytes)
  }

  public readonly public: Buffer | undefined
  public readonly signature: Buffer | undefined
}

class PublishSignatureBytesList extends Message<PublishSignatureBytesList> {
  static register (): void {
    registerMessage('PublishSignatureBytesList', PublishSignatureBytesList)
  }

  public readonly content: PublishSignatureBytes[] | undefined
}

class QueryIVSigs extends Message<QueryIVSigs> {
  static register (): void {
    registerMessage('QueryIVSigs', QueryIVSigs, PublishSignatureBytesList)
  }

  public readonly inputvalidationsigs: PublishSignatureBytesList | undefined
  public readonly inputvalidationsize1: number | undefined
  public readonly inputvalidationsize2: number | undefined
}

class QueryDiffP extends Message<QueryDiffP> {
  static register (): void {
    registerMessage('QueryDiffP', QueryDiffP)
  }

  public readonly lapmean: number | undefined
  public readonly lapscale: number | undefined
  public readonly noiselistsize: number | undefined
  public readonly quanta: number | undefined
  public readonly scale: number | undefined
  public readonly limit: number | undefined
}

class LogisticRegressionParameters extends Message<LogisticRegressionParameters> {
  static register (): void {
    registerMessage('LogisticRegressionParameters', LogisticRegressionParameters)
  }

  public readonly datasetname: string | undefined
  public readonly filepath: string | undefined
  public readonly nbrrecords: number | undefined
  public readonly nbrfeatures: number | undefined
  public readonly means: number | undefined
  public readonly standarddeviations: number | undefined

  public readonly lambda: number | undefined
  public readonly step: number | undefined
  public readonly maxiterations: number | undefined
  public readonly initialweights: number | undefined

  public readonly k: number | undefined
  public readonly precisionapproxcoefficients: number | undefined
}

export class Operation extends Message<Operation> {
  static register (): void {
    registerMessage('Operation', Operation, LogisticRegressionParameters)
  }

  public nameop: string | undefined
  public readonly nbrinput: number | undefined
  public readonly nbroutput: number | undefined
  public readonly querymin: number | undefined
  public readonly querymax: number | undefined
  public readonly lrparameters: LogisticRegressionParameters | undefined
}

class Int64List extends Message<Int64List> {
  static register (): void {
    registerMessage('Int64List', Int64List)
  }

  public readonly content: number[] | undefined
}

export class Query extends Message<Query> {
  static register (): void {
    registerMessage('Query', Query, Operation, Int64List, QueryDiffP, QueryIVSigs)
  }

  public readonly operation: Operation | undefined
  public readonly ranges: Int64List | undefined
  public readonly proofs: number | undefined
  public readonly obfuscation: boolean | undefined
  public readonly diffp: QueryDiffP | undefined

  public readonly ivsigs: QueryIVSigs | undefined
  public readonly rostervns: Cothority.network.Roster | undefined

  public readonly cuttingfactor: number | undefined

  public readonly selector: ColumnID[] | undefined
}

export class ServerIdentityList extends Message<ServerIdentityList> {
  static register (): void {
    registerMessage('ServerIdentityList', ServerIdentityList)
  }

  public readonly content: Cothority.network.ServerIdentity[] | undefined
}

export class SurveyQuery extends Message<SurveyQuery> {
  static register (): void {
    registerMessage('SurveyQuery', SurveyQuery, Query, Cothority.network.Roster, ServerIdentityList)
  }

  public readonly surveyid: string | undefined
  public readonly query: Query | undefined

  public readonly rosterservers: Cothority.network.Roster | undefined
  public readonly servertodp: { [_: string]: ServerIdentityList | undefined } | undefined
  public readonly idtopublic: { [_: string]: Buffer } | undefined

  // TODO readonly
  public clientpubkey: Buffer | undefined
  public readonly intramessage: boolean | undefined

  public readonly threshold: number | undefined
  public readonly aggregationproofthreshold: number | undefined
  public readonly obfuscationproofthreshold: number | undefined
  public readonly rangeproofthreshold: number | undefined
  public readonly keySwitchingproofthreshold: number | undefined
}

export class CipherText extends Message<CipherText> {
  static register (): void {
    registerMessage('CipherText', CipherText)
  }

  public readonly k: Buffer | undefined
  public readonly c: Buffer | undefined
}

class CipherVector extends Message<CipherVector> {
  static register (): void {
    registerMessage('CipherVector', CipherVector, CipherText)
  }

  public readonly content: CipherText[] | undefined
}

export class ResponseDP extends Message<ResponseDP> {
  static register (): void {
    registerMessage('ResponseDP', ResponseDP, CipherVector)
  }

  public readonly data: { [_: string]: CipherVector } | undefined
}
