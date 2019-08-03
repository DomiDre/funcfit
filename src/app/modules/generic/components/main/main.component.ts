import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { linear, parabola, fit } from 'rusfun';

class Parameter {
  name: string;
  value: number;
}
class genericModel {
  name: string;
  displayName: string;
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
  syData: Float64Array = new Float64Array([]);

  linspaceForm: FormGroup;
  parameterForm: FormGroup;


  models: genericModel[] = [
    { 
      name: 'linear',
      displayName: 'Linear',
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
      name: 'parabola',
      displayName: 'Parabola',
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
    }, { updateOn: 'blur' });

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
    this.parameterForm = this.formBuilder.group(paramGroup, { updateOn: 'blur' });

    // when parameters are changed externally
    // update internal parameters and update the plot
    this.parameterForm.valueChanges
    .subscribe(val => {
      console.log('change detected', val);
      if(this.selectedModel && this.parameterForm.valid) {
        for (let param of this.selectedModel.parameters) {
          param.value = val[param.name];
        }
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
    this.y = linear(
      new Float64Array([this.selectedModel.parameters[0].value, this.selectedModel.parameters[1].value]),
      new Float64Array(this.x));
  }

  setParabola() {
    this.calculate_linspace();
    this.y = parabola(
      new Float64Array([this.selectedModel.parameters[0].value, this.selectedModel.parameters[1].value, this.selectedModel.parameters[2].value]),
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
        const syData = [];

        for (let line of lines) {
          const splitted_line = line.split(/\s+/)
          x.push(Number(splitted_line[0]));
          yData.push(Number(splitted_line[1]));
          syData.push(1);
        }
        this.linspaceForm.disable();
        this.x = new Float64Array(x);
        this.yData = new Float64Array(yData);
        this.syData = new Float64Array(syData);
        if(this.selectedModel) {
          this.selectedModel.setFunction();
        }
      }
      reader.readAsText(this.selectedXYFile);
    }
  }

  run_fit() {
    // initialize parameter array
    let p_init: Float64Array = new Float64Array(this.selectedModel.parameters.length);
    for (let i in this.selectedModel.parameters) {
      p_init[i] = this.selectedModel.parameters[i].value;
    }
    // run fit
    console.log('fitting with p_init:', p_init);
    let p_result = fit(this.selectedModel.name, p_init, this.x, this.yData, this.syData);
    // update parameter array and plot new model
    console.log(p_result);

    let updated_vals = {};
    for (let i in this.selectedModel.parameters) {
      let param = this.selectedModel.parameters[i];
      param.value = p_result[i];
      updated_vals[param.name] = param.value;
    }
    this.parameterForm.setValue(updated_vals);
  }
}
