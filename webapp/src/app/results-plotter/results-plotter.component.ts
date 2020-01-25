import { List, Range } from 'immutable'

import { Component, Input, OnChanges } from '@angular/core'
import { Result, ResultType } from '../columns'

@Component({
  selector: 'app-results-plotter',
  templateUrl: './results-plotter.component.html'
})
export class ResultsPlotterComponent implements OnChanges {
  @Input() public results: List<[ResultType, Result]> | null | undefined

  public graph: Array<{ x: number[], y: number[], type: string, mode: string }> | undefined

  private readonly range = Range(0, 10)

  ngOnChanges (_: any): void {
    if (this.results === undefined || this.results === null) {
      return
    }

    if (this.results.size === 1) {
      return // do not update graph
    }

    if (this.results.size !== 2) {
      throw new Error("don't know how to do those yet")
    }

    const rawA = this.results.get(1)
    const rawB = this.results.get(0)
    if (rawA === undefined || rawA[0] !== 'number' ||
      rawB === undefined || rawB[0] !== 'number') {
      throw new Error()
    }

    const a = rawA[1] as number
    const b = rawB[1] as number

    const xPoints = this.range.toArray()
    const yPoints = this.range.map(x => a * x + b).toArray()

    this.graph = [{
      x: xPoints,
      y: yPoints,
      type: 'scatter',
      mode: 'lines'
    }]
  }
}
