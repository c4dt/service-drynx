import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatListModule, MatGridListModule, MatFormFieldModule, MatOptionModule, MatSelectModule } from '@angular/material';

import { AppComponent } from './app.component';
import { QueryRunnerComponent } from './query-runner/query-runner.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
	declarations: [
		AppComponent,
		QueryRunnerComponent,
	],
	imports: [
		BrowserAnimationsModule,
		BrowserModule,
		ReactiveFormsModule,

		MatFormFieldModule,
		MatGridListModule,
		MatButtonModule,
		MatListModule,
		MatOptionModule,
		MatSelectModule,
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
