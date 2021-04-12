import { List } from "immutable";

import {
  ColumnTypes,
  DatedDaysColumn,
  DatedYearsColumn,
  NumberColumn,
} from "@c4dt/angular-components";

export type Operation =
  | "linear regression"
  | "mean"
  | "standard deviation"
  | "sum"
  | "variance";
export function isOperation(obj: unknown): obj is Operation {
  switch (obj) {
    case "linear regression":
    case "mean":
    case "standard deviation":
    case "sum":
    case "variance":
      return true;
  }
  return false;
}

export type OperationableColumnTypes =
  | DatedDaysColumn
  | DatedYearsColumn
  | NumberColumn;

export type ScalableOperationAndColumn =
  | ["sum" | "variance" | "standard deviation", NumberColumn]
  | ["mean", OperationableColumnTypes];

export function isScalableOperationAndColumn(
  obj: [Operation, OperationableColumnTypes]
): obj is ScalableOperationAndColumn {
  switch (obj[0]) {
    case "sum":
    case "variance":
    case "standard deviation":
      if (obj[1] instanceof NumberColumn) return true;
      break;
    case "mean":
      return true;
  }

  return false;
}

export function scaleResult(
  operationOnColumn:
    | ScalableOperationAndColumn
    | ["interpolated linear regression", OperationableColumnTypes],
  result: number
): number | Date {
  switch (operationOnColumn[0]) {
    case "sum":
      return operationOnColumn[1].multiply(result);
    case "interpolated linear regression":
    case "mean":
      if (
        operationOnColumn[1] instanceof DatedDaysColumn ||
        operationOnColumn[1] instanceof DatedYearsColumn
      )
        return operationOnColumn[1].offset(result);
      else if (operationOnColumn[1] instanceof NumberColumn)
        return operationOnColumn[1].multiply(result);
      throw new Error("unexpected column type");
    case "variance":
      return operationOnColumn[1].multiply(
        operationOnColumn[1].multiply(result)
      );
    case "standard deviation":
      return operationOnColumn[1].multiply(result);
  }
}

export function getValidOperations(
  columns: List<OperationableColumnTypes>
): List<Operation> {
  switch (columns.size) {
    case 1: {
      const column = columns.get(0) as ColumnTypes;
      if (column instanceof NumberColumn)
        return List.of("sum", "mean", "variance", "standard deviation");
      else if (
        column instanceof DatedDaysColumn ||
        column instanceof DatedYearsColumn
      )
        return List.of("mean");
      break;
    }
    case 2:
    case 3:
      if (
        columns.every(
          (column) =>
            column instanceof NumberColumn ||
            column instanceof DatedDaysColumn ||
            column instanceof DatedYearsColumn
        )
      )
        return List.of("linear regression");
      break;
  }

  return List();
}
