import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { SharedModule } from '@shared/shared.module';


import { GenericRoutingModule } from './generic-routing.module';
import { MainComponent } from './components/main/main.component';


@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    GenericRoutingModule,
    // SharedModule
  ]
})
export class GenericModule { }
