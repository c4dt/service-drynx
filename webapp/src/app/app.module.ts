import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";

import * as PlotlyJS from "plotly.js";
import { PlotlyModule } from "angular-plotly.js";

import { AppComponent } from "./app.component";
import { QueryRunnerComponent } from "./query-runner/query-runner.component";
import { ResultsPlotter2DComponent } from "./results-plotter-2d/results-plotter-2d.component";
import { ResultsPlotter3DComponent } from "./results-plotter-3d/results-plotter-3d.component";
import { VisGraph3dComponent } from "./results-plotter-3d/vis-graph3d.component";
import { LibModule } from "@c4dt/angular-components";

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    QueryRunnerComponent,
    ResultsPlotter2DComponent,
    ResultsPlotter3DComponent,
    VisGraph3dComponent,
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

    PlotlyModule,
    LibModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
