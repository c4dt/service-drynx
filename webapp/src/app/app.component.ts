import { List } from "immutable";

import { Component } from "@angular/core";

import { InstanceID } from "@dedis/cothority/byzcoin";
import {
  ColumnType,
  ColumnRaw,
  Table,
  fetchDataset,
} from "@c4dt/angular-components";

import { ConfigService } from "./config.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  public datasets: Promise<List<Table>>;
  public columns: Promise<List<[ColumnType, string]>>;

  public readonly darc: InstanceID;

  constructor(config: ConfigService) {
    this.datasets = Promise.all(
      List(
        config.DataProviders.map(async (dp) =>
          fetchDataset(dp.datasetURL, dp.datasetTypesURL)
        )
      )
    ).then((l) => List(l));
    this.columns = this.datasets.then((ret) =>
      AppComponent.getRelevantColumns(List(ret))
    );
    this.darc = config.ByzCoin.LoginDarc;
  }

  private static getRelevantColumns(
    datasets: List<Table>
  ): List<[ColumnType, string]> {
    // TODO check that all datasets have the same types & names

    const firstDataset = datasets.get(0);
    if (firstDataset === undefined) return List();

    return firstDataset.columns
      .filter((column) => !(column[1] instanceof ColumnRaw))
      .map((column) => [column[1], column[0]]);
  }
}
