import { List } from "immutable";

import { Component } from "@angular/core";

import {
  ColumnTypes,
  Table,
  fetchDataset,
  StringColumn,
} from "@c4dt/angular-components";

import { ConfigService } from "./config.service";
import { OperationableColumnTypes } from "./operations";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  public datasets: List<Promise<Table>>;
  public columns: Promise<List<ColumnTypes>>;

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
  ): List<OperationableColumnTypes> {
    // TODO check that all datasets have the same types & names

    const firstDataset = datasets.get(0);
    if (firstDataset === undefined) return List();

    return firstDataset.columns.filter(
      (column) => !(column instanceof StringColumn)
    ) as List<OperationableColumnTypes>;
  }
}
