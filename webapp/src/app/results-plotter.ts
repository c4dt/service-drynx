import { Range } from "immutable";

import {
  DatedDaysColumn,
  DatedYearsColumn,
  NumberColumn,
} from "@c4dt/angular-components";

export type ColumnsForLinearRegression =
  | DatedDaysColumn
  | DatedYearsColumn
  | NumberColumn;

export const interpolationRange = Range(0, 10);

export function dateValueForColumn(
  column: DatedDaysColumn | DatedYearsColumn,
  date: Date
): number {
  if (column instanceof DatedDaysColumn) {
    const baseYear = date.getFullYear();

    let count = 0;
    while (date.getFullYear() === baseYear) {
      count += date.getDate();
      date.setDate(0);
    }

    return count;
  } else if (column instanceof DatedYearsColumn) {
    return date.getFullYear();
  }

  throw new Error("unknow column type");
}

export function getMaximumWidth(): [number, number] {
  const widthContainers = document.getElementsByTagName("app-query-runner");
  if (widthContainers === null) throw new Error("width container not found");
  const container: HTMLElement = widthContainers[0] as HTMLElement;

  return [container.offsetWidth, container.offsetHeight];
}
