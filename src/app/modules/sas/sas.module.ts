import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';


import { SasRoutingModule } from './sas-routing.module';
import { MainComponent } from './components/main/main.component';



@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SasRoutingModule,
    SharedModule
  ]
})
export class SasModule { }
