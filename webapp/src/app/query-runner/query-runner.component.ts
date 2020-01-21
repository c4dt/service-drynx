import { List, Map } from 'immutable'

import { Input, Component, OnChanges, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { ColumnID, SurveyQuery, Operation, Query, ServerIdentityList } from '@c4dt/drynx'
import * as cothority from '@dedis/cothority'

import { ClientService } from '../client.service'
import { ConfigService } from '../config.service'
import { ColumnType } from '../columns'

@Component({
  selector: 'app-query-runner',
  templateUrl: './query-runner.component.html'
})
export class QueryRunnerComponent implements OnChanges {
  public state: ['nothing-ran'] | ['loading'] | ['loaded', [ColumnType, number | Date]] | ['errored', Error]

  @Input() public columns: List<[ColumnType, ColumnID]> | null | undefined

  public readonly allOperations = ['sum', 'mean', 'variance', 'standard deviation']
  public operations: List<string>

  public readonly queryBuilder = new FormGroup({
    column: new FormControl(undefined, Validators.required),
    operation: new FormControl(undefined, Validators.required)
  })

  constructor (
    private readonly client: ClientService,
    private readonly config: ConfigService
  ) {
    this.state = ['nothing-ran']
    this.operations = List()
  }

  ngOnChanges (_?: SimpleChanges): void {
    const column = this.queryBuilder.get('column')
    if (column === null || column.value === null) {
      return
    }

    const operation = this.queryBuilder.get('operation')
    if (operation === null) {
      return
    }

    switch (column.value[0].kind) {
      case 'added':
        this.operations = List.of('sum', 'mean')
        break
      case 'multiplied':
        this.operations = List.of('sum', 'mean', 'variance', 'standard deviation')
        break
      case 'dated/days':
      case 'dated/years':
        this.operations = List.of('mean')
        break
      case 'raw':
        this.operations = List()
        break
      default:
        throw new Error(`unknown operation: ${column.value.kind}`)
    }

    if (this.operations.size === 1) {
      const first = this.operations.get(0)
      operation.setValue(first)
    }
  }

  buildQuery (): [ColumnType, SurveyQuery] | undefined {
    const operation = this.queryBuilder.get('operation')
    if (operation === null) {
      return undefined
    }

    const column = this.queryBuilder.get('column')
    if (column === null) {
      return undefined
    }

    const ids = this.config.DataProviders.map(d => d.identity)
    const actualDPs = ids.slice(1) // TODO

    let idtopublic: Map<string, Buffer> = Map()
    for (const n of ids) {
      idtopublic = idtopublic.set(n.address, n.public)
    }

    return [
      column.value[0],
      new SurveyQuery({
        surveyid: 'test-query',
        query: new Query({
          selector: [column.value[1]],
          operation: new Operation({
            nameop: operation.value,
            nbrinput: 1
          })
        }),
        rosterservers: new cothority.network.Roster({ list: ids }),
        servertodp: {
          [this.config.ComputingNode.address]:
          new ServerIdentityList({ content: actualDPs })
        },
        idtopublic: idtopublic.toJSON()
      })
    ]
  }

  throwOnUndefined<T> (val: T | undefined): T {
    if (val === undefined) {
      throw new Error('undefined found')
    }
    return val
  }

  async runQuery (query: [ColumnType, SurveyQuery]): Promise<void> {
    this.state = ['loading']

    if (query[1].query === undefined) {
      throw new Error('run query without query')
    }
    if (query[1].query.operation === undefined) {
      throw new Error('run query without operation')
    }

    try {
      const rawResults = await this.client.run(query[1])
      const results = query[0].forResults(this.config.TotalRowCount, query[1].query.operation, rawResults)
      if (results === undefined) {
        throw new Error('undefined operation')
      }
      this.state = ['loaded', [query[0], results]]
    } catch (e) {
      const error = (e instanceof Error) ? e : new Error(e)
      this.state = ['errored', error]
    }
  }
}
