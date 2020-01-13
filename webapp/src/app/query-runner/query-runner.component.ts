import { List, Map } from "immutable";

import { Input, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ColumnID, SurveyQuery, Operation, Query, ServerIdentityList } from '@c4dt/drynx';
import * as cothority from '@dedis/cothority';

import { ClientService } from "../client.service";
import { ConfigService } from '../config.service';

@Component({
	selector: 'app-query-runner',
	templateUrl: './query-runner.component.html',
})
export class QueryRunnerComponent {
	@Input() public columns: List<ColumnID> | null | undefined;

	public readonly operations = ["sum", "mean", "variance"];

	public readonly queryBuilder = new FormGroup({
		operation: new FormControl(this.operations[0], Validators.required),
		column: new FormControl(undefined, Validators.required),
	})

	public launchQuery: SurveyQuery | undefined;
	public results: number[] | undefined;

	constructor(
		private readonly client: ClientService,
		private readonly config: ConfigService,
	) {}

	buildQuery(): SurveyQuery | undefined {
		const operation = this.queryBuilder.get("operation");
		if (operation === null)
			return undefined

		const column = this.queryBuilder.get("column");
		if (column === null)
			return undefined

		const ids = this.config.DataProviders.map(d => d.identity);
		const actualDPs = ids.slice(1); // TODO

		let idtopublic: Map<string, Buffer> = Map();
		for (const n of ids) {
			idtopublic = idtopublic.set(n.address, n.public)
		}

		return new SurveyQuery({
			surveyid: "test-query",
			query: new Query({
					selector: [column.value],
					operation: new Operation({
						nameop: operation.value,
						nbrinput: 1,
					}),
				}),

			rosterservers: new cothority.network.Roster({list: ids}),
			servertodp: {
				[this.config.ComputingNode.address]:
					new ServerIdentityList({content: actualDPs})},
			idtopublic: idtopublic.toJSON(),
		})
	}

	throwOnUndefined<T>(val: T | undefined): T {
		if (val === undefined)
			throw new Error("undefined found")
		return val;
	}

	async runQuery(query: SurveyQuery) {
		this.results = await this.client.run(query);
	}
}
