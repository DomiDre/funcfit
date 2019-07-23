import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Plotting1DRoutingModule } from './plotting1-d-routing.module';
import { PlotComponent } from './components/plot/plot.component';


@NgModule({
  declarations: [PlotComponent],
  imports: [
    CommonModule,
    Plotting1DRoutingModule
  ]
})
export class Plotting1DModule { }
