import { List, Map } from 'immutable'

import { Component, Input } from '@angular/core'

import { ColumnID } from '@c4dt/drynx'

import { ColumnType } from '../columns'

type TableElement = number | Date | string
type TableObject = Array<{ [_: string]: [ColumnType, TableElement] }>

export class Table {
  public constructor (
    public readonly types: List<ColumnType>,
    public readonly header: List<ColumnID>,
    public readonly rows: List<List<string>>
  ) {
    if (types.size !== header.size) {
      throw new Error('unconsistent width for types')
    }

    for (const row of rows) {
      if (row.size !== header.size) {
        throw new Error('unconsistent width')
      }
    }
  }

  public toObject (): TableObject {
    const ret = this.rows.map(row => this.types.zip(row).zip(this.header)
      .reduce((acc, [[type, value], name]) =>
        acc.set(name, [type, type.forRow(value)]), Map())
    ).toJS()
    return ret
  }
}

@Component({
  selector: 'app-dataprovider-viewer',
  templateUrl: './dataprovider-viewer.component.html'
})
export class DataproviderViewerComponent {
  @Input() public table: Table | null | undefined
}
