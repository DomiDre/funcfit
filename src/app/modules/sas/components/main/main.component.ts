import { Component, OnInit } from '@angular/core';
import { model, fit } from 'rusfun';
import { models } from './models';
import { FittingService } from '@shared/services/fitting.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor(
    public fittingService: FittingService) { }

  ngOnInit() {
    // on creation of component init linspace formgroup with default values
    this.fittingService.initLinspaceGroups(0.01, 0.5, 100);

    // set models in fittingService to the module function models
    this.fittingService.models = models;

    // set function that can calculate the model for given function name,
    // parameter- and x-array
    this.fittingService.modelCalc = model;

    this.fittingService.fitRoutine = fit;
  }
}
