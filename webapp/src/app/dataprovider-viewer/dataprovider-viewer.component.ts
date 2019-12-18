import { Map, List } from "immutable";

import { Component, Input } from '@angular/core';

import { ColumnID } from "@c4dt/drynx";

type TableObject<T> = { [_: string]: T }[];

export class Table<T> {
	public constructor(
		public readonly header: List<ColumnID>,
		public readonly rows: List<List<T>>,
	) {
		for (const row of rows)
			if (row.size != header.size)
				throw new Error(`unconsistent width`)
	}

	public toObject(): TableObject<T> {
		return this.rows.map(row =>
			this.header.zip(row).reduce((acc, [name, value]) => {
				acc[name] = value;
				return acc
			}, {} as { [_: string]: T })
		).toJS();
	}
}

@Component({
	selector: 'app-dataprovider-viewer',
	templateUrl: './dataprovider-viewer.component.html',
})
export class DataproviderViewerComponent {
	@Input() public table: Table<string> | undefined;
}
