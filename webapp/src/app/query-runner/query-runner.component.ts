import { List, Map } from "immutable";

import { Input, Component, OnChanges } from "@angular/core";
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";

import {
  ColumnID,
  SurveyQuery,
  Operation as DrynxOperation,
  Query,
  ServerIdentityList,
} from "@c4dt/drynx";
import {
  ColumnType,
  Columns,
  ResultType,
  Operation,
  Result,
  isColumnType,
} from "@c4dt/angular-components";
import * as cothority from "@dedis/cothority";

import { ClientService } from "../client.service";
import { ConfigService } from "../config.service";

@Component({
  selector: "app-query-runner",
  templateUrl: "./query-runner.component.html",
})
export class QueryRunnerComponent implements OnChanges {
  public state:
    | ["nothing-ran"]
    | ["loading"]
    | ["loaded", string, Columns, List<[ResultType, Result]>]
    | ["errored", Error] = ["nothing-ran"];

  @Input() public columns: List<[ColumnType, ColumnID]> | null | undefined;

  // TODO take it from columns.ts
  public readonly allOperations = [
    "sum",
    "mean",
    "variance",
    "standard deviation",
    "linear regression",
  ];
  public operations: List<Operation> = List();
  public tabIndex = 0;

  public readonly queryBuilder = new FormGroup({
    columns: new FormControl(undefined, Validators.required),
    operation: new FormControl(undefined, Validators.required),
  });

  constructor(
    private readonly client: ClientService,
    private readonly config: ConfigService
  ) {}

  private getFormElement(name: "columns" | "operation"): AbstractControl {
    const form = this.queryBuilder.get(name);
    if (form === null) throw new Error(`input "${name}" not found`);
    return form;
  }

  private getFormValue(name: "columns" | "operation"): unknown | undefined {
    const form = this.getFormElement(name);
    if (form.value === null) return undefined;
    return form.value;
  }

  private getColumnsValue(): List<[ColumnType, ColumnID]> | undefined {
    const values = this.getFormValue("columns");
    if (values === undefined) return undefined;

    if (!Array.isArray(values))
      throw new Error(`input "columns" didn't returned an array: ${values}`);

    const list = List(values as unknown[]);
    if (list.some((tuple) => !Array.isArray(tuple)))
      throw new Error(
        `input "columns" returned an array with unexpected elements: ${values}`
      );
    if ((list as List<unknown[]>).some((tuple) => tuple.length !== 2))
      throw new Error(
        `input "columns" returned an array with unexpected tuples' size: ${values}`
      );
    if (
      (list as List<[unknown, unknown]>).some(
        ([t, id]) => !isColumnType(t) || typeof id !== "string"
      )
    )
      throw new Error(
        `input "columns" returned an array with unexpected tuples' types: ${values}`
      );

    return (list as List<[ColumnType, string]>).sortBy((v) => v[1]);
  }

  private getOperationValue(): Operation | undefined {
    const value = this.getFormValue("operation");

    if (!(value instanceof Operation))
      throw new Error(
        `form's input "operations" returned an unexpected value: ${value}`
      );

    return value;
  }

  ngOnChanges(): void {
    const columnsValue = this.getColumnsValue();
    if (columnsValue === undefined) return;

    const columns = new Columns(List(columnsValue).map(([t]) => t));
    this.operations = columns.validOperations;

    const operationForm = this.getFormElement("operation");
    operationForm.setValue(this.operations.get(0));
  }

  buildQuery(): [Columns, Operation, SurveyQuery] | undefined {
    const operation = this.getOperationValue();
    const columnsValue = this.getColumnsValue();
    if (operation === undefined || columnsValue === undefined) return undefined;

    const columns = new Columns(columnsValue.map(([t]) => t));

    const ids = List.of(this.config.ComputingNode).concat(
      this.config.DataProviders.map((d) => d.identity)
    );

    const idToPublic: Map<string, Buffer> = Map(
      ids.map((id) => [id.address, id.public])
    );

    return [
      columns,
      operation,
      new SurveyQuery({
        surveyid: "test-query",
        query: new Query({
          selector: columnsValue.map(([, id]) => id).toArray(),
          operation: new DrynxOperation({
            nameop:
              operation.type === "linear regression"
                ? "lin_reg"
                : operation.type,
            nbrinput: columns.items.size,
          }),
        }),
        rosterservers: new cothority.network.Roster({ list: ids.toArray() }),
        servertodp: {
          [this.config.ComputingNode.address]: new ServerIdentityList({
            content: this.config.DataProviders.map((d) => d.identity).toArray(),
          }),
        },
        idtopublic: idToPublic.toJSON(),
      }),
    ];
  }

  throwOnUndefined<T>(val: T | undefined): T {
    if (val === undefined) throw new Error("undefined value");
    return val;
  }

  async runQuery([columns, operation, query]: [
    Columns,
    Operation,
    SurveyQuery
  ]): Promise<void> {
    if (query.query === undefined) throw new Error("run query without query");
    if (query.query.operation === undefined)
      throw new Error("run query without operation");

    this.state = ["loading"];
    this.tabIndex = 1;

    try {
      const { computed } = await this.client.run(query);
      if (computed === undefined) throw new Error("undefined results");

      const label = `The ${query.query.operation.nameop} of ${columns.items
        .map((c) => c.name)
        .join()} is:`;
      const results = operation.formatResults(computed);
      this.state = ["loaded", label, columns, results];
    } catch (e) {
      const error = e instanceof Error ? e : new Error(e);
      this.state = ["errored", error];
      throw error;
    }
  }
}
