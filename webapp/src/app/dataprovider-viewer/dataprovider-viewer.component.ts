import { List } from 'immutable'

import { Component, Input } from '@angular/core'

import { ColumnID } from '@c4dt/drynx'

type TableElement = number | Date | string
export enum ColumnType {
  Number,
  Date,
  String,
}
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

  private static parseWithType (type: ColumnType, value: string): TableElement {
    const lastYear = new Date().getFullYear() - 1
    switch (type) {
      case ColumnType.Number: {
        const num = Number.parseInt(value, 10)
        if (Number.isNaN(num)) {
          throw new Error(`invalid number: ${value}`)
        }
        return num
      }
      case ColumnType.Date: {
        const offset = Number.parseInt(value, 10)
        if (Number.isNaN(offset) || offset < 0 || offset > 365) {
          throw new Error(`invalid date: ${value}`)
        }
        const date = new Date(lastYear, 0)
        date.setDate(offset)
        return date
      }
      case ColumnType.String:
        return value
    }
  }

  public toObject (): TableObject {
    const empty: { [_: string]: [ColumnType, TableElement] } = {}
    return this.rows.map(row => this.types.zip(row).zip(this.header)
      .reduce((acc, [[type, value], name]) => {
        acc[name] = [type, Table.parseWithType(type, value)]
        return acc
      }, empty)
    ).toJS()
  }
}

@Component({
  selector: 'app-dataprovider-viewer',
  templateUrl: './dataprovider-viewer.component.html'
})
export class DataproviderViewerComponent {
  @Input() public table: Table | null | undefined

  readonly ColumnType = ColumnType
}
