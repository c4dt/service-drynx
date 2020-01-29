import { List, Range, Seq, Repeat, Collection } from 'immutable'

import { Component, Input, OnChanges } from '@angular/core'
import { Result, ResultType, Columns, ColumnMultiplied, ColumnDatedYears, ColumnType } from '../columns'

type Point = Collection.Indexed<number>
type Points = Collection.Indexed<Point>

@Component({
  selector: 'app-results-plotter',
  templateUrl: './results-plotter.component.html'
})
export class ResultsPlotterComponent implements OnChanges {
  @Input() public label: string | null | undefined
  @Input() public results: List<[ResultType, Result]> | null | undefined
  @Input() public columns: Columns | null | undefined

  public graph: { data: any[], layout: any } | undefined

  private readonly range = Range(0, 10)

  ngOnChanges (_: any): void {
    if (this.results === undefined || this.results === null ||
      this.columns === undefined || this.columns === null) {
      return
    }

    if (this.results.size === 1) {
      return // do not update graph
    }

    if (this.results.size !== this.columns.items.size || this.results.size > 3) {
      throw new Error()
    }

    if (this.results.some(([t, _]) => t !== 'number')) {
      throw new Error()
    }
    const resultsNumbers = this.results.map(([_, r]) => r as number)

    const ranges = Repeat(this.range, this.results.size - 1)
    const inputs = ranges
      .reduce((acc, val) => val.flatMap(i => acc.map(l => Seq([...l, i]))), Seq([Seq([1])]))

    inputs.forEach(v => console.log(v.toArray()))

    const computed = inputs.map(ins => ins
      .zip(resultsNumbers)
      .map(([l, r]) => l * r)
      .reduce((acc, val) => acc + val, 0)
    )

    const columnMapper = function<T> (points: Collection<T, number>, column: ColumnType): Collection<T, number> {
      return points.map(v => scaler(v, column))
    }

    const scaler = function (value: number, column: ColumnType): number {
      if (column instanceof ColumnMultiplied) {
        return value * column.factor
      }

      if (column instanceof ColumnDatedYears) {
        return value + column.offset.getFullYear()
      }

      throw new Error()
    }

    console.log('==')
    computed.forEach(v => console.log(v))

    const points = inputs
      .map(l => l.rest())
      .zip(computed).map(([l, n]) => List.of(...l, n))

    const scaledPoints = this.scalePoints(points, this.columns)

    const data = this.pointsToObject(scaledPoints)

    const layout = this.columns.items
      .zip(List.of('x', 'y', 'z'))
      .reduce((acc, [col, n]) => {
        acc[`${n}axis`] = {
          title: col.name,
          range: [columnMapper(Seq([0]), col).first(), columnMapper(Seq([10]), col).first()]
        }
        return acc
      }, {
        autosize: false,
        width: 500,
        height: 300
      } as any)

    this.graph = {
      data: [data],
      layout: layout
    }
  }

  private pointsToObject (points: Points): any {
    if (this.results === undefined || this.results === null) {
      throw new Error()
    }

    const keyes = List.of('x', 'y', 'z')
    return points
      .reduce((acc, input) => {
        keyes.zip(input).forEach(([key, i]) => {
          if (!(key in acc)) {
            acc[key] = []
          }
          acc[key].push(i)
        })
        return acc
      }, {
        type: this.results.size === 2 ? 'scatter' : 'mesh3d',
        mode: 'lines'
      } as any)
  }

  private scalePoints (points: Points, columns: Columns): Points {
    const scaler = function (column: ColumnType, value: number): number {
      if (column instanceof ColumnMultiplied) {
        return value * column.factor
      }

      if (column instanceof ColumnDatedYears) {
        return value + column.offset.getFullYear()
      }

      throw new Error()
    }

    return points
      .map(point => columns.items
        .zip(point)
        .map(([col, value]) => scaler(col, value)))
  }
}
