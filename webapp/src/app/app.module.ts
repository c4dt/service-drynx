import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule, MatListModule, MatGridListModule, MatFormFieldModule, MatOptionModule, MatSelectModule, MatTableModule, MatTabsModule } from '@angular/material'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { ScrollingModule } from '@angular/cdk/scrolling'

import { AppComponent } from './app.component'
import { QueryRunnerComponent } from './query-runner/query-runner.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DataproviderViewerComponent } from './dataprovider-viewer/dataprovider-viewer.component'

// TODO CDN because of plotly/plotly.js#3518
import { PlotlyViaCDNModule } from 'angular-plotly.js'
import { OmniledgerLoginModule } from './omniledger-login/omniledger-login.module'
import { ResultsPlotterComponent } from './results-plotter/results-plotter.component'

PlotlyViaCDNModule.plotlyVersion = 'latest'

@NgModule({
  declarations: [
    AppComponent,
    QueryRunnerComponent,
    DataproviderViewerComponent,
    ResultsPlotterComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,
    ScrollingModule,

    MatButtonModule,
    MatFormFieldModule,
    MatGridListModule,
    MatListModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,

    PlotlyViaCDNModule,

    OmniledgerLoginModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
