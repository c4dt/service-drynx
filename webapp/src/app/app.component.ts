import { List } from "immutable";

import { Component } from '@angular/core';
import * as csv from "papaparse";

import { ColumnID } from "@c4dt/drynx";

import { ConfigService } from "./config.service";
import { Table } from "./dataprovider-viewer/dataprovider-viewer.component";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styles: ['app-dataprovider-viewer { box-shadow: 0 0 10px grey; height: calc(100% - 20px); width: calc(100% - 20px) }'],
})
export class AppComponent {
	public datasets: List<Promise<Table<string>>>;
	public columns: Promise<List<ColumnID>>;

	constructor(
		private readonly config: ConfigService,
	) {
		this.datasets = List(this.config.DataProviders.map(dp => AppComponent.fetchDataset(dp.datasetURL)))
		this.columns = Promise.all(this.datasets).then((ret) => AppComponent.getCommonColumns(List(ret)))
	}

	private static async fetchDataset(url: URL): Promise<Table<string>> {
		const results = await new Promise<csv.ParseResult>((resolve, reject) => csv.parse(url.href, {
			download: true,
			delimiter: "\t",
			skipEmptyLines: true,
			complete: resolve,
			error: reject,
		}));
		for (const err of results.errors)
			throw new Error(`when CSV parsing: ${err.message}`);
		const rows = results.data;

		if (rows.length == 0)
			throw new Error("dataset doesn't have any row")
		const header: List<string> = List(rows.shift());

		return new Table(header, List(rows.map(l => List(l))));
	}

	private static getCommonColumns(datasets: List<Table<string>>): List<ColumnID> {
		// TODO actually merge commons
		const found = datasets.get(0);
		if (found === undefined)
			return List();
		return found.header;
	}
}
