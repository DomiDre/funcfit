import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { XygraphComponent } from './components/xygraph/xygraph.component';


@NgModule({
  declarations: [XygraphComponent],
  imports: [
    CommonModule
  ],
  exports: [
    MaterialModule,
    HttpClientModule,
    FlexLayoutModule,
    XygraphComponent
  ]
})
export class SharedModule { }
