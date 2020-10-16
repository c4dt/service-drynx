import { List } from "immutable";

import { Component } from "@angular/core";

import { ColumnType, Table, fetchDataset } from "@c4dt/angular-components";

import { ConfigService } from "./config.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  public datasets: List<Promise<Table>>;
  public columns: Promise<List<[ColumnType, string]>>;

  constructor(config: ConfigService) {
    this.datasets = List(
      config.DataProviders.map(async (dp) =>
        fetchDataset(dp.datasetURL, dp.datasetTypesURL)
      )
    );
    this.columns = Promise.all(this.datasets).then((datasets) =>
      AppComponent.getRelevantColumns(List(datasets))
    );
  }

  private static getRelevantColumns(
    datasets: List<Table>
  ): List<[ColumnType, string]> {
    // TODO check that all datasets have the same types & names

    const firstDataset = datasets.get(0);
    if (firstDataset === undefined) return List();

    return firstDataset.columns
      .filter((column) => !(column[1].kind === "string"))
      .map((column) => [column[1], column[0]]);
  }
}
