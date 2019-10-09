import { Map } from "immutable";

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { SurveyQuery, Operation, Query, ServerIdentityList } from '@c4dt/drynx';
import * as cothority from '@dedis/cothority';

import { ClientService } from "../client.service";
import { ConfigService } from '../config.service';

@Component({
	selector: 'app-query-runner',
	templateUrl: './query-runner.component.html',
})
export class QueryRunnerComponent {
	public readonly operations = ["sum", "mean", "variance"];

	public readonly queryBuilder = new FormGroup({
		operation: new FormControl(this.operations[0], Validators.required),
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

		const nodes: cothority.network.ServerIdentity[] = [
			this.config.ComputingNode,
			...this.config.DataProviders.map(d => d.identity),
		]

		nodes.forEach(si => console.log(si.getPublic().toString()))
		
		let idtopublic: Map<string, Buffer> = Map();
		for (const n of nodes) {
			idtopublic = idtopublic.set(n.address, n.public)
		}

		return new SurveyQuery({
			surveyid: "test-query",
			query: new Query({
					selector: ["col1"],
					operation: new Operation({
						nameop: operation.value,
					}),
				}),

			rosterservers: new cothority.network.Roster({list: nodes}),
			servertodp: {
				[this.config.ComputingNode.address]:
					new ServerIdentityList({content: this.config.DataProviders.map(d => d.identity)})},
			idtopublic: idtopublic.toJSON(),
		})
	}

	async runQuery(query: SurveyQuery) {
		this.results = await this.client.run(query);
	}
}
