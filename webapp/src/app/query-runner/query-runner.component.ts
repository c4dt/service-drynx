import { List, Map } from "immutable";

import { Input, Component, OnChanges } from "@angular/core";
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";

import {
  SurveyQuery,
  Operation as DrynxOperation,
  Query,
  ServerIdentityList,
} from "@c4dt/drynx";
import {
  AngularColumnTypes,
  ColumnTypes,
  isColumnType,
  StringColumn,
  toAngularColumnTypes,
} from "@c4dt/angular-components";
import * as cothority from "@dedis/cothority";

import { ClientService } from "../client.service";
import { ConfigService } from "../config.service";
import {
  getValidOperations,
  Operation,
  OperationableColumnTypes,
  isOperation,
  scaleResult,
  isScalableOperationAndColumn,
} from "../operations";

@Component({
  selector: "app-query-runner",
  templateUrl: "./query-runner.component.html",
})
export class QueryRunnerComponent implements OnChanges {
  public state:
    | ["nothing-ran"]
    | ["loading"]
    | ["loaded: single result", string, [AngularColumnTypes, number | Date]]
    | [
        "loaded: two results",
        [OperationableColumnTypes, OperationableColumnTypes],
        [number, number]
      ]
    | [
        "loaded: three results",
        [
          OperationableColumnTypes,
          OperationableColumnTypes,
          OperationableColumnTypes
        ],
        [number, number, number]
      ]
    | ["errored", Error] = ["nothing-ran"];

  @Input() public columns: List<ColumnTypes> | null | undefined;

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

  private getColumnsValue(): List<OperationableColumnTypes> | undefined {
    const values = this.getFormValue("columns");
    if (values === undefined) return undefined;

    if (!Array.isArray(values))
      throw new Error(`input "columns" didn't returned an array: ${values}`);

    const list = List(values as unknown[]);
    if (
      (list as List<unknown>).some(
        (t) => !isColumnType(t) || t instanceof StringColumn
      )
    )
      throw new Error(
        `input "columns" returned an array with unexpected tuples' types: ${values}`
      );

    return (list as List<OperationableColumnTypes>).sortBy(
      (column) => column.name
    );
  }

  private getOperationValue(): Operation | undefined {
    const value = this.getFormValue("operation");

    if (!isOperation(value))
      throw new Error(
        `form's input "operations" returned an unexpected value: ${value}`
      );

    return value;
  }

  ngOnChanges(): void {
    const columnsValue = this.getColumnsValue();
    if (columnsValue === undefined) return;

    this.operations = getValidOperations(columnsValue);

    const operationForm = this.getFormElement("operation");
    operationForm.setValue(this.operations.get(0));
  }

  buildQuery():
    | [List<OperationableColumnTypes>, Operation, SurveyQuery]
    | undefined {
    const operation = this.getOperationValue();
    const columns = this.getColumnsValue();
    if (operation === undefined || columns === undefined) return undefined;

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
          selector: columns.map((column) => column.name).toArray(),
          operation: new DrynxOperation({
            nameop: operation === "linear regression" ? "lin_reg" : operation,
            nbrinput: columns.size,
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
    List<OperationableColumnTypes>,
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

      if (computed.size !== columns.size)
        throw new Error("results' size not matched to columns' size");

      if (computed.size === 1) {
        const column = columns.get(0) as OperationableColumnTypes;
        const result = computed.get(0) as number;

        if (operation === "linear regression")
          throw new Error("linear regression results on a single column");
        const operationAndColumn: [Operation, OperationableColumnTypes] = [
          operation,
          column,
        ];
        if (!isScalableOperationAndColumn(operationAndColumn))
          throw new Error("unable to match operation and column for result");

        const scaled = scaleResult(operationAndColumn, result);

        this.state = [
          "loaded: single result",
          `The ${query.query.operation.nameop} of ${columns
            .map((c) => c.name)
            .join()} is:`,
          [toAngularColumnTypes(column), scaled],
        ];
      } else if (computed.size === 2) {
        this.state = [
          "loaded: two results",
          columns.toArray() as [
            OperationableColumnTypes,
            OperationableColumnTypes
          ],
          computed.toArray() as [number, number],
        ];
      } else if (computed.size === 3) {
        this.state = [
          "loaded: three results",
          columns.toArray() as [
            OperationableColumnTypes,
            OperationableColumnTypes,
            OperationableColumnTypes
          ],
          computed.toArray() as [number, number, number],
        ];
      } else {
        throw new Error("too much columns to compute");
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(e);
      this.state = ["errored", error];
      throw error;
    }
  }
}
