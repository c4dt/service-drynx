import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatListModule } from '@angular/material/list'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { MatProgressBarModule } from '@angular/material/progress-bar'

import { AppComponent } from './app.component'
import { QueryRunnerComponent } from './query-runner/query-runner.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { LibModule } from '@c4dt/angular-components'

@NgModule({
  declarations: [
    AppComponent,
    QueryRunnerComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatGridListModule,
    MatListModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,

    LibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
