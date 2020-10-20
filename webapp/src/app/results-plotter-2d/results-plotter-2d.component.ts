import { Seq } from "immutable";

import { Component, Input, OnChanges } from "@angular/core";

import { MultipliedColumn } from "@c4dt/angular-components";

import { scaleResult } from "../operations";
import {
  ColumnsForLinearRegression,
  getMaximumWidth,
  interpolationRange,
} from "../results-plotter";

type Point2D = [number, number];

@Component({
  selector: "app-results-plotter-2d",
  templateUrl: "./results-plotter-2d.component.html",
})
export class ResultsPlotter2DComponent implements OnChanges {
  @Input() public factors: [number, number] | null | undefined;
  @Input() public columns:
    | [ColumnsForLinearRegression, ColumnsForLinearRegression]
    | null
    | undefined;

  public plotlyGraph:
    | {
        data: Record<string, unknown>[];
        layout: Record<string, unknown>;
      }
    | undefined;

  ngOnChanges(): void {
    if (
      this.factors === undefined ||
      this.factors === null ||
      this.columns === undefined ||
      this.columns === null
    )
      return;

    const factors = this.factors;
    const columns = this.columns;

    const points = interpolationRange.zip(
      interpolationRange.map((input) => factors[1] * input + factors[0])
    );
    const scaled: Seq.Indexed<Point2D> = points.map(
      (point) =>
        point.map((value, i) =>
          scaleResult(["interpolated linear regression", columns[i]], value)
        ) as Point2D
    );

    const autoMinRange = scaled.min();
    if (autoMinRange === undefined) throw new Error("mininum point not found");
    const minRange = autoMinRange.map((min, i) =>
      columns[i] instanceof MultipliedColumn && min > 0 ? 0 : min
    ) as Point2D;

    const maxRange = scaled.max();
    if (maxRange === undefined) throw new Error("maximum point not found");

    const [width, height] = getMaximumWidth();
    this.plotlyGraph = {
      data: [
        scaled.reduce(
          (acc, input) => {
            ["x", "y"].forEach((key, i) => {
              if (!(key in acc)) acc[key] = [];
              (acc[key] as number[]).push(input[i]);
            });
            return acc;
          },
          {
            type: "scatter",
            mode: "lines",
          } as Record<string, unknown>
        ),
      ],
      layout: {
        xaxis: {
          title: columns[0].name,
          range: [minRange[0], maxRange[0]],
        },
        yaxis: {
          title: columns[1].name,
          range: [minRange[1], maxRange[1]],
        },
        autosize: false,
        width: width,
        height: height,
      },
    };
  }
}
