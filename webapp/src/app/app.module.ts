import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatListModule, MatGridListModule, MatFormFieldModule, MatOptionModule, MatSelectModule, MatTableModule } from '@angular/material';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AppComponent } from './app.component';
import { QueryRunnerComponent } from './query-runner/query-runner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataproviderViewerComponent } from './dataprovider-viewer/dataprovider-viewer.component';

@NgModule({
	declarations: [
		AppComponent,
		QueryRunnerComponent,
		DataproviderViewerComponent,
	],
	imports: [
		BrowserAnimationsModule,
		BrowserModule,
		ReactiveFormsModule,
		ScrollingModule,

		MatFormFieldModule,
		MatGridListModule,
		MatButtonModule,
		MatListModule,
		MatOptionModule,
		MatSelectModule,
		MatTableModule,
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
