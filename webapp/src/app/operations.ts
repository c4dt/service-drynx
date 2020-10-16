import { ColumnType } from "@c4dt/angular-components";
import { List } from "immutable";

export type OperationKind =
  | "sum"
  | "mean"
  | "variance"
  | "standard deviation"
  | "linear regression";

export type Result =
  | ["number", number]
  | ["date/days", Date]
  | ["date/years", Date]
  | ["string", string];

export class Operation {
  constructor(
    public readonly kind: OperationKind,
    private readonly columns: List<ColumnType>
  ) {}

  formatResults(results: List<number>): List<Result> {
    if (this.columns.size !== results.size)
      throw new Error("not the same for columns and results");

    return this.columns.zip(results).map(([column, result]) => {
      if (column.kind === "date/days" || column.kind === "date/years") {
        const date = results.get(0);
        if (date === undefined) throw new Error("expected a single re");

        const ret = new Date(column.offset.getTime());
        column.dateSetter(ret, date);
        return [column.kind, ret];
      } else if (column.kind === "multiplied") {
        switch (this.kind) {
          case "sum":
            return ["number", column.factor * result];
          case "mean":
            return ["number", column.factor * result];
          case "standard deviation":
            return ["number", column.factor * result];
          case "variance":
            return ["number", column.factor * column.factor * result];
          case "linear regression":
            return ["number", result];
        }
      }

      throw new Error(`unable to format results for a ${column.kind} column`);
    });
  }
}

export function getValidOperations(items: List<ColumnType>): List<Operation> {
  const item = items.get(0);
  if (item !== undefined && items.size === 1) {
    switch (item.kind) {
      case "multiplied":
        return List.of<OperationKind>(
          "sum",
          "mean",
          "variance",
          "standard deviation"
        ).map((op) => new Operation(op, items));
      case "date/days":
      case "date/years":
        return List.of(new Operation("mean", items));
      case "string":
        return List.of();
      default:
        throw new Error("unknow column kind");
    }
  } else if (items.size === 2 || items.size === 3) {
    if (
      items.some(
        (item) =>
          item.kind !== "multiplied" &&
          item.kind !== "date/days" &&
          item.kind !== "date/years"
      )
    )
      return List();
    return List.of(new Operation("linear regression", items));
  }

  return List();
}
