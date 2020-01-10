import { List } from "immutable";

import { Component } from '@angular/core';
import * as csv from "papaparse";

import { ColumnID } from "@c4dt/drynx";

import { ConfigService } from "./config.service";
import { ColumnType, Table } from "./dataprovider-viewer/dataprovider-viewer.component";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
})
export class AppComponent {
	public datasets: List<Promise<Table>>;
	public columns: Promise<List<ColumnID>>;

	constructor(
		private readonly config: ConfigService,
	) {
		this.datasets = List(this.config.DataProviders.map(dp => AppComponent.fetchDataset(dp.datasetURL, dp.datasetTypesURL)))
		this.columns = Promise.all(this.datasets).then(ret => AppComponent.getUsableColumns(List(ret)))
	}

	private static async getAndParseCSV(url: URL): Promise<List<List<string>>> {
		const results = await new Promise<csv.ParseResult>((resolve, reject) => csv.parse(url.href, {
			download: true,
			delimiter: "\t",
			skipEmptyLines: true,
			complete: resolve,
			error: reject,
		}));
		for (const err of results.errors)
			throw new Error(`when CSV parsing: ${err.message}`);
		return List(results.data.map((row: string[]) => List(row)));
	}

	private static async fetchDataset(datasetURL: URL, datasetTypesURL: URL): Promise<Table> {
		const typesCSV = this.getAndParseCSV(datasetTypesURL);
		const datasetCSV = this.getAndParseCSV(datasetURL);

		const typesStr = (await typesCSV).get(0);
		if ((await typesCSV).size !== 1 || typesStr === undefined)
			throw new Error("dataset's types should contain a single line")
		const types = typesStr.map(t => { switch(t) {
			case "number": return ColumnType.Number;
			case "date": return ColumnType.Date;
			case "string": return ColumnType.String;
			default: throw new Error(`unknown dataset's type: ${t}`);
		}});

		const header = (await datasetCSV).get(0);
		if (header === undefined)
			throw new Error("dataset doesn't have any row")

		return new Table(types, header, (await datasetCSV).shift());
	}

	private static getUsableColumns(datasets: List<Table>): List<ColumnID> {
		const first = datasets.get(0);
		if (first === undefined)
			return List();
		const firstColumns: List<[ColumnType, ColumnID] | undefined> = first.types.zip(first.header);

		const merged = datasets.shift().reduce((acc, dataset) => {
			return acc.zipAll(dataset.types.zip(dataset.header))
				.map(([left, right]) => {
					if (left === undefined || left[0] !== right[0] || left[1] !== right[1])
						return undefined;
					return left;
				})
		}, firstColumns);

		// @ts-ignore
		// TODO filter for undefined doesn't reduce type
		const filtered: List<[ColumnType, ColumnID]> = merged
			.filter(column => column !== undefined);

		return filtered
			.filter(([t, _]) => t === ColumnType.Number || t === ColumnType.Date)
			.map(([_, id]) => id);
	}
}
