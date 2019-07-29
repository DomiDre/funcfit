import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { wasm_linear, wasm_parabola } from 'rusfun';

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

  
  x: Float64Array = new Float64Array([]);
  y: Float64Array = new Float64Array([]);
  yData: Float64Array = new Float64Array([]);

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
  selectedXYFile: Blob;

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
    if (this.yData.length === 0) {
      const x = [];
      const xMin = Number(this.linspaceForm.controls.xMin.value);
      const xMax = Number(this.linspaceForm.controls.xMax.value)
      const N = Number(this.linspaceForm.controls.Nx.value);
      const step = (xMax - xMin) / (N - 1);
      for (let i=0; i<N; i++) {
        x.push(xMin + i*step);
      }
      this.x = new Float64Array(x);
    }
  }

  setLinear() {
    this.calculate_linspace();
    this.y = wasm_linear(
      new Float64Array([Number(this.parameterForm.controls.a.value), Number(this.parameterForm.controls.b.value)]),
      new Float64Array(this.x));
  }

  setParabola() {
    this.calculate_linspace();
    this.y = wasm_parabola(
      new Float64Array([Number(this.parameterForm.controls.a.value), Number(this.parameterForm.controls.b.value), Number(this.parameterForm.controls.c.value)]),
      new Float64Array(this.x));
  }

  loadXYData(xyFileInput) {
    const fileList: FileList = xyFileInput.target.files;
    if ( fileList.length > 0 ) {
      this.selectedXYFile = xyFileInput.target.files[0];
      // // get XY src for preview
      const reader = new FileReader();
      reader.onload = event => {
        const content = reader.result;
        const lines = String(content).split('\n');
        const x = [];
        const yData = [];

        for (let line of lines) {
          const splitted_line = line.split(/\s+/)
          x.push(Number(splitted_line[0]));
          yData.push(Number(splitted_line[1]));
        }
        this.linspaceForm.disable();
        this.x = new Float64Array(x);
        this.yData = new Float64Array(yData);
        if(this.selectedModel) {
          this.selectedModel.setFunction();
        }
      }
      reader.readAsText(this.selectedXYFile);
    }
  }
}
