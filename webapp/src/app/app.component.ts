import { List } from 'immutable'

import { Component } from '@angular/core'
import * as csv from 'papaparse'

import { ColumnID } from '@c4dt/drynx'
import { InstanceID } from '@dedis/cothority/byzcoin'

import { ConfigService } from './config.service'
import { ColumnType, ColumnMultiplied, ColumnDatedYears, ColumnDatedDays, ColumnRaw } from './columns'
import { Table } from './dataprovider-viewer/dataprovider-viewer.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  public datasets: List<Promise<Table>>
  public columns: Promise<List<[ColumnType, ColumnID]>>

  public readonly darc: InstanceID

  constructor (
    config: ConfigService
  ) {
    this.datasets = List(config.DataProviders.map(async dp => AppComponent.fetchDataset(dp.datasetURL, dp.datasetTypesURL)))
    this.columns = Promise.all(this.datasets).then(ret => AppComponent.getRelevantColumns(List(ret)))
    this.darc = config.ByzCoin.LoginDarc
  }

  private static async getAndParseCSV (url: URL): Promise<List<List<string>>> {
    const results = await new Promise<csv.ParseResult<string[]>>((resolve, reject) => csv.parse(url.href, {
      download: true,
      delimiter: '\t',
      skipEmptyLines: true,
      complete: resolve,
      error: reject
    }))
    for (const err of results.errors) {
      throw new Error(`when CSV parsing: ${err.message}`)
    }
    return List(results.data.map((row: string[]) => List(row)))
  }

  private static async fetchDataset (datasetURL: URL, datasetTypesURL: URL): Promise<Table> {
    const typesCSV = this.getAndParseCSV(datasetTypesURL)
    const datasetCSV = this.getAndParseCSV(datasetURL)

    const header = (await datasetCSV).get(0)
    if (header === undefined) {
      throw new Error("dataset doesn't have any row")
    }

    const typesStr = (await typesCSV).get(0)
    if ((await typesCSV).size !== 1 || typesStr === undefined) {
      throw new Error("dataset's types should contain a single line")
    }
    const types = typesStr.zip(header).map(([t, name]) => {
      switch (t) {
        case 'string': return new ColumnRaw(name)
      }

      const numericMatches = t.match(/^\*(\d+)$/)
      if (numericMatches !== null) {
        const value = Number.parseInt(numericMatches[1])
        if (Number.isNaN(value)) {
          throw new Error(`unable to parse as int: ${numericMatches[1]}`)
        }
        return new ColumnMultiplied(name, value)
      }

      const dateMatches = t.match(/^date\/(years|days)\+(\d+)$/)
      if (dateMatches !== null) {
        const value = Number.parseInt(dateMatches[2])
        if (Number.isNaN(value)) {
          throw new Error(`unable to parse as int: ${dateMatches[2]}`)
        }
        const date = new Date(value, 0)
        switch (dateMatches[1]) {
          case 'years': return new ColumnDatedYears(name, date)
          case 'days': return new ColumnDatedDays(name, date)
        }
      }

      throw new Error(`unknown dataset's type: ${t}`)
    })

    const content = (await datasetCSV).shift()
    return new Table(types, header, content)
  }

  private static getRelevantColumns (datasets: List<Table>): List<[ColumnType, ColumnID]> {
    const first = datasets.get(0)
    if (first === undefined) {
      return List()
    }
    const firstColumns: List<[ColumnType, ColumnID] | undefined> = first.types.zip(first.header)

    const merged = datasets.shift().reduce((acc, dataset) => {
      return acc.zipAll(dataset.types.zip(dataset.header))
        .map(([left, right]) => {
          // TODO check that types are the same
          if (left === undefined || left[1] !== right[1]) {
            return undefined
          }
          return left
        })
    }, firstColumns)

    // @ts-ignore
    // TODO filter for undefined doesn't reduce type
    const filtered: List<[ColumnType, ColumnID]> = merged
      .filter(column => column !== undefined)

    return filtered
      .filter(([t, _]) => !(t instanceof ColumnRaw))
  }
}
