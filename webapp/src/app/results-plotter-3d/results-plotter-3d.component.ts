import { List, Seq } from "immutable";

import { Component, Input, OnChanges } from "@angular/core";

import { VisPoint3D } from "./types";
import { scaleResult } from "../operations";
import {
  ColumnsForLinearRegression,
  interpolationRange,
  getMaximumWidth,
} from "../results-plotter";

type Point3D = [number, number, number];

@Component({
  selector: "app-results-plotter-3d",
  templateUrl: "./results-plotter-3d.component.html",
})
export class ResultsPlotter3DComponent implements OnChanges {
  @Input() public factors: [number, number, number] | null | undefined;
  @Input() public columns:
    | [
        ColumnsForLinearRegression,
        ColumnsForLinearRegression,
        ColumnsForLinearRegression
      ]
    | null
    | undefined;

  public visGraph:
    | { data: VisPoint3D[]; options: Record<string, unknown> }
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

    const inputs = interpolationRange.flatMap((a) =>
      interpolationRange.map((b) => [a, b])
    );
    const interpolated = inputs.map(
      ([a, b]) => factors[2] * a + factors[1] * b + factors[0]
    );

    const points = inputs
      .zip(interpolated)
      .map(([input, value]) => [input[0], input[1], value]);
    const scaled: Seq.Indexed<Point3D> = points.map(
      (point) =>
        point.map((value, i) =>
          scaleResult(["interpolated linear regression", columns[i]], value)
        ) as Point3D
    );

    const [width, height] = getMaximumWidth();
    this.visGraph = {
      data: scaled
        .map(([x, y, z], id) => {
          return { id, x, y, z };
        })
        .toJS(),
      options: {
        width: `${width}px`,
        height: `${height}px`,
        style: "surface",
        showGrid: true,
        keepAspectRatio: false,
        xLabel: columns[0].name,
        yLabel: columns[1].name,
        zLabel: columns[2].name,
        axisFontSize: 20,
        tooltipDelay: 0,
        tooltip: (point: { x: number; y: number; z: number }) =>
          List.of(
            `${columns[0].name}: ${point.x.toFixed()}`,
            `${columns[1].name}: ${point.y.toFixed()}`,
            `${columns[2].name}: ${point.z.toFixed()}`
          ).join("<br>"),
      },
    };
  }
}
