import { List, Range, Seq } from 'immutable'

import { Component, Input, OnChanges } from '@angular/core'
import { Result, ResultType, Columns, ColumnMultiplied, ColumnDatedYears, ColumnType } from '../columns'

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

    if (this.results.size !== 2 || this.columns.items.size !== 2) {
      throw new Error("don't know how to do those yet")
    }

    const rawA = this.results.get(1)
    const rawB = this.results.get(0)
    const rawColumnX = this.columns.items.get(0)
    const rawColumnY = this.columns.items.get(1)
    if (rawA === undefined || rawA[0] !== 'number' ||
      rawB === undefined || rawB[0] !== 'number' ||
      rawColumnX === undefined || rawColumnY === undefined) {
      throw new Error()
    }

    const a = rawA[1] as number
    const b = rawB[1] as number

    const columnMapper = function (points: Seq.Indexed<number>, column: ColumnType): Seq.Indexed<number> {
      if (column instanceof ColumnMultiplied) {
        return points.map(p => p * column.factor)
      }

      if (column instanceof ColumnDatedYears) {
        return points.map(p => p + column.offset.getFullYear())
      }

      throw new Error()
    }

    const xPoints = columnMapper(this.range, rawColumnX)
    const yPoints = columnMapper(this.range.map(x => a * x + b), rawColumnY)

    this.graph = {
      data: [{
        x: xPoints.toArray(),
        y: yPoints.toArray(),
        type: 'scatter',
        mode: 'lines'
      }],
      layout: {
        autosize: false,
        width: 500,
        height: 300,
        xaxis: {
          automargin: true,
          title: rawColumnX.name
        },
        yaxis: {
          automargin: true,
          title: rawColumnY.name,
          range: [0, columnMapper(Seq([10]), rawColumnY).get(0)]
        }
      }
    }
  }
}
