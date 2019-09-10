import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { Angular2SwapiModule } from 'angular2-swapi';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Angular2SwapiModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
