import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { XygraphComponent } from './components/xygraph/xygraph.component';
import { LogXLogYGraphComponent } from './components/logxlogygraph/logxlogygraph.component';


@NgModule({
  declarations: [XygraphComponent, LogXLogYGraphComponent],
  imports: [
    CommonModule
  ],
  exports: [
    MaterialModule,
    HttpClientModule,
    FlexLayoutModule,
    XygraphComponent,
    LogXLogYGraphComponent
  ]
})
export class SharedModule { }
