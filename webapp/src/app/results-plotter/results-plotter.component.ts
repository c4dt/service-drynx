import { List, Range, Seq, Repeat, Collection } from 'immutable'
// TODO better types
// @ts-ignore
import { DataSet } from 'vis-graph3d'

import { Component, Input, OnChanges } from '@angular/core'
import { Result, ResultType, Columns, ColumnMultiplied, ColumnDatedYears, ColumnType } from '../columns'

type Point = Collection.Indexed<number>

@Component({
  selector: 'app-results-plotter',
  templateUrl: './results-plotter.component.html'
})
export class ResultsPlotterComponent implements OnChanges {
  @Input() public label: string | null | undefined
  @Input() public results: List<[ResultType, Result]> | null | undefined
  @Input() public columns: Columns | null | undefined

  public plotlyGraph: { data: any[], layout: any } | undefined

  public visGraphData: DataSet | undefined
  public visGraph3DOptions: any | undefined

  private readonly range = Range(0, 10)

  ngOnChanges (): void {
    if (this.results === undefined || this.results === null ||
        this.columns === undefined || this.columns === null
    ) {
      return
    }

    if ((this.results.size < 2 || this.results.size > 3) &&
        this.results.some(([t, _]) => t !== 'number' && t !== 'date/years')) {
      return // do not update graph
    }

    const columns = this.columns

    const factors = this.results.map(([_, r]) => r as number)
    const points = this.interpolateFunction(factors)
    const scalled = ResultsPlotterComponent.scalePoints(columns, points)
    const ranges: [Point, Point] = [
      scalled.reduce((acc, p) => acc.zip(p).map(([x, y]) => x < y ? x : y)
        .zip(columns.items)
        .map(([n, col]) => col.kind === 'multiplied' ? 0 : n)),
      scalled.reduce((acc, p) => acc.zip(p).map(([x, y]) => x > y ? x : y))
    ]

    if (this.results.size === 2) {
      this.plotlyGraph = {
        data: [scalled
          .reduce((acc, input) => {
            List.of('x', 'y')
              .zip(input)
              .forEach(([key, i]) => {
                if (!(key in acc)) {
                  acc[key] = []
                }
                acc[key].push(i)
              })
            return acc
          }, {
            type: 'scatter',
            mode: 'lines'
          } as any)],
        layout: this.gen2DOptions(this.columns, ranges)
      }
    } else if (this.results.size === 3) {
      this.visGraphData = ResultsPlotterComponent.pointsToDataSet(scalled)
      this.visGraph3DOptions = this.gen3DOptions(this.columns)
    }
  }

  private interpolateFunction (factors: List<number>): Seq.Indexed<Point> {
    const offset: number = factors.first(0)
    const ranges = Repeat(this.range, factors.size - 1)
    const inputs = ranges
      .reduce((acc, range) =>
        acc.flatMap(l => range.map(i => l.push(i))),
      Seq([List<number>()]))

    const interpolated = inputs.map(input => input
      .zip(factors.shift())
      .map(([l, r]) => l * r)
      .reduce((acc, val) => acc + val, offset))

    return inputs
      .zip(interpolated)
      .map(([input, value]) => input.push(value))
  }

  private static scalePoints (columns: Columns, points: Seq.Indexed<Point>): Seq.Indexed<Point> {
    const scaler = function (column: ColumnType, value: number): number {
      if (column instanceof ColumnMultiplied) {
        return value * column.factor
      }

      if (column instanceof ColumnDatedYears) {
        return value + column.offset.getFullYear()
      }

      throw new Error('columns scaler unmatched to results')
    }

    return points
      .map(point => columns.items
        .zip(point)
        .map(([col, value]) => scaler(col, value)))
  }

  private static pointsToDataSet (points: Seq.Indexed<Point>): DataSet {
    const ret = new DataSet()

    points
      .forEach(point => {
        const objectified: any = {
          x: point.get(0),
          y: point.get(1)
        }
        if (point.toList().size === 3) {
          objectified.z = point.get(2)
        }

        ret.add(objectified)
      })

    return ret
  }

  private static getMaximumWidth (): [number, number] {
    const widthContainers = document.getElementsByTagName('app-query-runner')
    if (widthContainers === null) {
      throw new Error('width container not found')
    }
    const container: HTMLElement = widthContainers[0] as HTMLElement

    return [container.offsetWidth, container.offsetHeight]
  }

  private gen2DOptions (columns: Columns, ranges: [Point, Point]): any {
    const [width, height] = ResultsPlotterComponent.getMaximumWidth()
    const columnsName: List<string> = columns.items.map(col => col.name)

    return columnsName
      .zip(List.of('x', 'y', 'z'))
      .zip(ranges[0].zip(ranges[1]))
      .reduce((acc, [[col, n], [min, max]]) => {
        acc[`${n}axis`] = {
          title: col,
          range: [min, max]
        }
        return acc
      }, {
        autosize: false,
        width: width,
        height: height
      } as any)
  }

  private gen3DOptions (columns: Columns): any {
    const [width, height] = ResultsPlotterComponent.getMaximumWidth()
    const columnsName: List<string> = columns.items.map(col => col.name)

    return {
      width: `${width}px`,
      height: `${height}px`,
      style: 'surface',
      showGrid: true,
      keepAspectRatio: false,
      xLabel: columnsName.get(0),
      yLabel: columnsName.get(1),
      zLabel: columnsName.get(2),
      axisFontSize: 20,
      tooltipDelay: 0,
      tooltip: (point: {x: number, y: number, z: number}) =>
        List.of(
          `${columnsName.get(0)}: ${point.x.toFixed()}`,
          `${columnsName.get(1)}: ${point.y.toFixed()}`,
          `${columnsName.get(2)}: ${point.z.toFixed()}`)
          .join('<br>')
    }
  }
}
