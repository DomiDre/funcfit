import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

class Parameter {
  name: string;
  value: number;
}
class genericModel {
  name: string;
  parameters: Parameter[];
  infoText: string;
  setFunction: Function;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  
  x: number[] = [];
  y: number[] = [];
  linspaceForm: FormGroup;
  parameterForm: FormGroup;


  models: genericModel[] = [
    { 
      name: 'Linear',
      parameters: [{
        name: 'a',
        value: 1
      }, {
        name: 'b',
        value: 0
      }],
      infoText: 'Function:\na*x + b',
      setFunction: this.setLinear.bind(this)
    },
    {
      name: 'Parabola',
      parameters: [{
        name: 'a',
        value: 1
      }, {
        name: 'b',
        value: 0
      }, {
        name: 'c',
        value: 0
      }],
      infoText: 'Function:\na*x^2 + b*x + c',
      setFunction: this.setParabola.bind(this)}
  ]

  selectedModel: genericModel;

  constructor(
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.linspaceForm = this.formBuilder.group({
      xMin: [0, [Validators.required]],
      xMax: [1, Validators.required],
      Nx: [10, Validators.required]
    });

    this.linspaceForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.linspaceForm.valid) {
        this.selectedModel.setFunction();
      }
    });
  }

  

  modelSelected() {
    const paramGroup = {};
    for (const param of this.selectedModel.parameters) {
      paramGroup[param.name] = [param.value, Validators.required]
    }
    this.parameterForm = this.formBuilder.group(paramGroup);
    this.parameterForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.parameterForm.valid) {
        this.selectedModel.setFunction();
      }
    });
    this.selectedModel.setFunction();

  }

  calculate_linspace() {
    this.x = [];
    const step = (this.linspaceForm.controls.xMax.value - this.linspaceForm.controls.xMin.value) / (this.linspaceForm.controls.Nx.value - 1)
    for (let i=0; i<this.linspaceForm.controls.Nx.value; i++) {
      this.x.push(this.linspaceForm.controls.xMin.value + i*step);
    }
  }

  setLinear() {
    this.calculate_linspace();
    this.y = this.x.map(x => Number(this.parameterForm.controls.a.value) * x + Number(this.parameterForm.controls.b.value));
  }

  setParabola() {
    this.calculate_linspace();
    this.y = this.x.map(x => Number(this.parameterForm.controls.a.value) * x**2 + Number(this.parameterForm.controls.b.value) * x + Number(this.parameterForm.controls.c.value));
  }
}
