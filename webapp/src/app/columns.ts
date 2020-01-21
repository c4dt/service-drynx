import { List } from 'immutable'

import { Operation } from '@c4dt/drynx'

interface ColumnMapper<T> {
  kind: string
  forRow (value: string): T
  forResults (totalRowCount: number, op: Operation, results: List<number>): T | undefined
}

export class ColumnMultiplied implements ColumnMapper<number> {
  public readonly kind = 'multiplied'

  constructor (
    public readonly factor: number
  ) {}

  forRow (value: string): number {
    const num = Number.parseInt(value, 10)
    if (Number.isNaN(num)) {
      throw new Error(`invalid number: ${value}`)
    }

    return this.factor * num
  }

  forResults (_: number, op: Operation, results: List<number>): number {
    switch (op.nameop) {
      case 'sum': {
        if (results.size !== 1) {
          throw new Error('unexpected shape')
        }
        const sum = results.get(0)
        if (sum === undefined) {
          throw new Error('unexpected shape')
        }
        return this.factor * sum
      }
      case 'mean': {
        if (results.size !== 1) {
          throw new Error('unexpected shape')
        }
        const mean = results.get(0)
        if (mean === undefined) {
          throw new Error('unexpected shape')
        }
        return this.factor * mean
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

        if (op.nameop === 'standard deviation') {
          return this.factor * variance
        }
        return this.factor * this.factor * variance
      }
    }

    throw new Error('unknown operation')
  }
}

abstract class ColumnDated implements ColumnMapper<Date> {
  abstract kind: string

  constructor (
    private readonly dateSetter: (toSet: Date, value: number) => void,
    private readonly offset: Date
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

  forResults (_1: number, _2: Operation, results: List<number>): Date {
    const date = results.get(0)
    if (date === undefined) {
      throw new Error('weird shape for a date')
    }

    const ret = new Date(this.offset.getTime())
    this.dateSetter(ret, date)
    return ret
  }
}

export class ColumnDatedDays extends ColumnDated {
  public readonly kind = 'dated/days'

  constructor (offset: Date) {
    super((toSet: Date, value: number) => toSet.setDate(value), offset)
  }
}

export class ColumnDatedYears extends ColumnDated {
  public readonly kind = 'dated/years'

  constructor (offset: Date) {
    super((toSet: Date, value: number) => toSet.setFullYear(offset.getFullYear() + value), offset)
  }
}

export class ColumnRaw implements ColumnMapper<string> {
  public readonly kind = 'raw'

  forRow (value: string): string {
    return value
  }

  forResults (_1: number, _2: Operation, _3: List<number>): undefined {
    return undefined
  }
}

export type ColumnType = ColumnMultiplied | ColumnDatedDays | ColumnDatedYears | ColumnRaw
