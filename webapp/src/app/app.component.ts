import { List } from "immutable";

import { Component } from '@angular/core';
import * as csv from "papaparse";

import { ConfigService } from "./config.service";
import { Table } from "./dataprovider-viewer/dataprovider-viewer.component";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styles: ['app-dataprovider-viewer { width: 80%; }'],
})
export class AppComponent {
	public datasets: List<Promise<Table<string>>>;

	constructor(
		private readonly config: ConfigService,
	) {
		this.datasets = List(this.config.DataProviders.map(dp => AppComponent.fetchDataset(dp.datasetURL)))
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
}
