import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material.module';
import { XygraphComponent } from './components/xygraph/xygraph.component';


@NgModule({
  declarations: [XygraphComponent],
  imports: [
    CommonModule
  ],
  exports: [
    MaterialModule,
    FlexLayoutModule,
    XygraphComponent
  ]
})
export class SharedModule { }
