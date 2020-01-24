import { List, Map } from 'immutable'

import { Input, Component, OnChanges, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms'

import { ColumnID, SurveyQuery, Operation as DrynxOperation, Query, ServerIdentityList } from '@c4dt/drynx'
import * as cothority from '@dedis/cothority'

import { ClientService } from '../client.service'
import { ConfigService } from '../config.service'
import { ColumnType, Columns, OperationType, ResultType, Operation, Result } from '../columns'

@Component({
  selector: 'app-query-runner',
  templateUrl: './query-runner.component.html'
})
export class QueryRunnerComponent implements OnChanges {
  public state: ['nothing-ran'] | ['loading'] | ['loaded', List<[ResultType, Result]>] | ['errored', Error]

  @Input() public columns: List<[ColumnType, ColumnID]> | null | undefined

  // TODO take it from columns.ts
  public readonly allOperations = ['sum', 'mean', 'variance', 'standard deviation', 'linear regression']
  public operations: List<OperationType>

  public readonly queryBuilder = new FormGroup({
    columns: new FormControl(undefined, Validators.required),
    operation: new FormControl(undefined, Validators.required)
  })

  constructor (
    private readonly client: ClientService,
    private readonly config: ConfigService
  ) {
    this.state = ['nothing-ran']
    this.operations = List()
  }

  private getForm (name: 'columns' | 'operation'): AbstractControl {
    const form = this.queryBuilder.get(name)
    if (form === null) {
      throw new Error()
    }
    return form
  }

  private getFormValue (name: 'columns' | 'operation'): any | undefined {
    const form = this.getForm(name)
    if (form.value === null) {
      return undefined
    }
    return form.value
  }

  private getColumnsValue (): List<[ColumnType, ColumnID]> | undefined {
    const value = this.getFormValue('columns')
    if (value === undefined) {
      return undefined
    }
    return List(value)
  }

  private getOperationValue (): OperationType | undefined {
    return this.getFormValue('operation')
  }

  ngOnChanges (_?: SimpleChanges): void {
    const columnsValue = this.getColumnsValue()
    if (columnsValue === undefined) {
      return
    }
    const operationForm = this.getForm('operation')

    const columns = new Columns(List(columnsValue).map(([t, _]) => t))
    this.operations = columns.validOperations.map(op => op.type)

    if (this.operations.size === 1) {
      const first = this.operations.get(0)
      operationForm.setValue(first)
    }
  }

  buildQuery (): [Operation, SurveyQuery] | undefined {
    const operationValue = this.getOperationValue()
    const columnsValue = this.getColumnsValue()
    if (operationValue === undefined || columnsValue === undefined) {
      return undefined
    }

    const columns = new Columns(columnsValue.map(([t, _]) => t))
    const matches = columns.validOperations
      .filter(op => op.type === operationValue)
    const operation = matches.get(0)
    if (operation === undefined || matches.size > 1) {
      throw new Error()
    }

    const ids = this.config.DataProviders.map(d => d.identity)
    const actualDPs = ids.slice(1) // TODO

    let idToPublic: Map<string, Buffer> = Map()
    for (const n of ids) {
      idToPublic = idToPublic.set(n.address, n.public)
    }

    return [
      operation,
      new SurveyQuery({
        surveyid: 'test-query',
        query: new Query({
          selector: columnsValue.map(([_, id]) => id).toArray(),
          operation: new DrynxOperation({
            nameop: operationValue === 'linear regression' ? 'lin_reg' : operationValue,
            // TODO only for linear regression for two rows
            nbrinput: operationValue === 'linear regression' ? 2 : 1,
            //nbroutput: operationValue === 'linear regression' ? 5 : undefined,
          })
        }),
        rosterservers: new cothority.network.Roster({ list: ids }),
        servertodp: {
          [this.config.ComputingNode.address]:
          new ServerIdentityList({ content: actualDPs })
        },
        idtopublic: idToPublic.toJSON()
      })
    ]
  }

  throwOnUndefined<T> (val: T | undefined): T {
    if (val === undefined) {
      throw new Error('undefined found')
    }
    return val
  }

  extractSecond<T> (t: [any, T]): T {
    return t[1]
  }

  async runQuery ([operation, query]: [Operation, SurveyQuery]): Promise<void> {
    this.state = ['loading']

    if (query.query === undefined) {
      throw new Error('run query without query')
    }
    if (query.query.operation === undefined) {
      throw new Error('run query without operation')
    }

    try {
      const rawResults = await this.client.run(query)
      const results = operation.formatResults(rawResults)
      if (results === undefined) {
        throw new Error('undefined operation')
      }
      this.state = ['loaded', results]
    } catch (e) {
      const error = (e instanceof Error) ? e : new Error(e)
      this.state = ['errored', error]
      throw error
    }
  }
}
