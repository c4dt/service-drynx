import { List, Range } from 'immutable'

import { Component, Input, OnChanges } from '@angular/core'

// A very simple plotter class that takes into account the scaling happening
// in the drynx-demonstrator.
// It plots 100 points from x_real = 0 to x_real = xmax * factors[0]
@Component({
  selector: 'app-results-plotter',
  templateUrl: './results-plotter.component.html'
})
export class ResultsPlotterComponent implements OnChanges {
  // factors to calculate
  //   x_real = x_db * factor_0
  // and
  //   y_real = y_db * factor_1
  @Input() factors: number[] = [1, 1]
  // betas from the linear regression: y_db = beta_0 + beta_1 * x_db
  @Input() betas: List<number> | undefined

  private readonly range = Range(0, 10)

  public graph: { data: Array<{ x: number[], y: number[], type: string, mode: string }> } | undefined

  ngOnChanges (_: any): void {
    if (this.factors === undefined || this.betas === undefined) {
      return
    }

    if (this.factors.length !== this.betas.size ||
      this.factors.length !== 2) {
      throw new Error("don't know how to do those yet")
    }

    const rawA = this.betas.get(1)
    const rawB = this.betas.get(0)
    if (rawA === undefined || rawB === undefined) {
      throw new Error()
    }

    const xPoints = this.range.toArray()
    const yPoints = this.range.map(x => rawA * x + rawB).toArray()

    this.graph = {
      data: [{
        x: xPoints,
        y: yPoints,
        type: 'scatter',
        mode: 'lines'
      }]
    }
  }
}
