import { List } from 'immutable'

interface ColumnMapper<T> {
  name: string
  kind: string
  forResults (op: OperationType, results: List<number>): [ResultType, Result] | undefined
  forRow (value: string): T
  equals (other: any): boolean
}

export class ColumnMultiplied implements ColumnMapper<number> {
  public readonly kind = 'multiplied'

  constructor (
    public readonly name: string,
    public readonly factor: number
  ) {}

  forRow (value: string): number {
    const num = Number.parseInt(value, 10)
    if (Number.isNaN(num)) {
      throw new Error(`invalid number: ${value}`)
    }

    return this.factor * num
  }

  forResults (op: OperationType, results: List<number>): ['number', number] {
    switch (op) {
      case 'sum': {
        if (results.size !== 1) {
          throw new Error('unexpected shape')
        }
        const sum = results.get(0)
        if (sum === undefined) {
          throw new Error('unexpected shape')
        }
        return ['number', this.factor * sum]
      }
      case 'mean': {
        if (results.size !== 1) {
          throw new Error('unexpected shape')
        }
        const mean = results.get(0)
        if (mean === undefined) {
          throw new Error('unexpected shape')
        }
        return ['number', this.factor * mean]
      }
      case 'standard deviation':
      case 'variance': {
        if (results.size !== 1) {
          throw new Error('unexpected shape')
        }
        const variance = results.get(0)
        if (variance === undefined) {
          throw new Error('unexpected shape')
        }

        if (op === 'standard deviation') {
          return ['number', this.factor * variance]
        }
        return ['number', this.factor * this.factor * variance]
      }
    }

    throw new Error('unknown operation')
  }

  equals (other: any): boolean {
    return other instanceof ColumnMultiplied && other.factor === this.factor
  }
}

abstract class ColumnDated implements ColumnMapper<Date> {
  abstract kind: ResultType

  constructor (
    public readonly name: string,
    private readonly dateSetter: (toSet: Date, value: number) => void,
    public readonly offset: Date
  ) {}

  forRow (value: string): Date {
    const date = Number.parseInt(value, 10)
    if (Number.isNaN(date) || date < 0 || date > 365) {
      throw new Error(`invalid date: ${value}`)
    }

    const ret = new Date(this.offset.getTime())
    this.dateSetter(ret, date)
    return ret
  }

  forResults (_: any, results: List<number>): [ResultType, Date] {
    const date = results.get(0)
    if (date === undefined) {
      throw new Error('weird shape for a date')
    }

    const ret = new Date(this.offset.getTime())
    this.dateSetter(ret, date)
    return [this.kind, ret]
  }

  equals (other: any): boolean {
    return other instanceof ColumnDated && other.kind === this.kind
  }
}

export class ColumnDatedDays extends ColumnDated {
  public readonly kind = 'date/days'

  constructor (name: string, offset: Date) {
    super(name, (toSet: Date, value: number) => toSet.setDate(value), offset)
  }
}

export class ColumnDatedYears extends ColumnDated {
  public readonly kind = 'date/years'

  constructor (name: string, offset: Date) {
    super(name, (toSet: Date, value: number) => toSet.setFullYear(offset.getFullYear() + value), offset)
  }
}

export class ColumnRaw implements ColumnMapper<string> {
  public readonly kind = 'raw'

  constructor (
    public readonly name: string
  ) {}

  forRow (value: string): string {
    return value
  }

  forResults (): undefined {
    return undefined
  }

  equals (other: any): boolean {
    return other instanceof ColumnRaw
  }
}

export type ColumnType = ColumnMultiplied | ColumnDatedDays | ColumnDatedYears | ColumnRaw

export type OperationType = 'sum' | 'mean' | 'variance' | 'standard deviation' | 'linear regression'
export type ResultType = 'number' | 'date/days' | 'date/years' | 'string'
export type Result = number | Date | string

export class Operation {
  constructor (
    public readonly type: OperationType,
    private readonly columns: List<ColumnType>
  ) {}

  formatResults (results: List<number>): List<[ResultType, Result]> {
    switch (this.type) {
      case 'linear regression':
        // TODO assert this.columns instanceof ColumnMultiplied
        return results.map(num => ['number', num])
      default: {
        const column = this.columns.get(0)
        if (column === undefined || this.columns.size > 1) {
          throw new Error()
        }
        const ret = column.forResults(this.type, results)
        if (ret === undefined) {
          throw new Error()
        }
        return List.of(ret)
      }
    }
  }
}

export class Columns {
  public readonly validOperations: List<Operation>

  constructor (
    public readonly items: List<ColumnType>
  ) {
    const item = items.get(0)
    if (item !== undefined && items.size === 1) {
      switch (item.kind) {
        case 'multiplied': {
          const ops: OperationType[] = ['sum', 'mean', 'variance', 'standard deviation']
          this.validOperations = List(ops.map(op => new Operation(op, this.items)))
          break
        }
        case 'date/days':
        case 'date/years':
          this.validOperations = List.of(new Operation('mean', this.items))
          break
        case 'raw':
          this.validOperations = List.of()
          break
        default:
          throw new Error()
      }
    } else if (items.size === 2 || items.size === 3) {
      // TODO verify columns compatibility
      this.validOperations = List.of(new Operation('linear regression', this.items))
    } else {
      this.validOperations = List()
    }
  }
}
