import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatDialogModule } from '@angular/material/dialog'

import { OmniledgerLoginComponent, OmniledgerLoginDialog } from './omniledger-login.component'

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule
  ],
  declarations: [
    OmniledgerLoginComponent,
    OmniledgerLoginDialog
  ],
  exports: [OmniledgerLoginComponent],
  entryComponents: [OmniledgerLoginDialog]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OmniledgerLoginModule {}
