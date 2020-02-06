// TODO better types
// @ts-ignore
import { DataSet, Graph3d } from 'vis-graph3d'

import { Directive, ElementRef, OnChanges, Input } from '@angular/core'

@Directive({
  selector: '[visGraph3D]'
})
export class VisGraph3DDirective implements OnChanges {
  @Input() public data: DataSet | null | undefined
  @Input() public options: any | null | undefined

  constructor (private readonly element: ElementRef) {}

  ngOnChanges (): void {
    if (this.data === null || this.data === undefined ||
      this.options === null || this.options === undefined) {
      return
    }

    new Graph3d(this.element.nativeElement, this.data, this.options)
  }
}
