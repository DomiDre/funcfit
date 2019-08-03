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

  // for compatibility with rusfun code, store data in Float64Arrays
  x: Float64Array = new Float64Array([]);
  y: Float64Array = new Float64Array([]);
  yData: Float64Array = new Float64Array([]);
  syData: Float64Array = new Float64Array([]);

  // FormGroup to control the linspace if no data is present
  linspaceForm: FormGroup;
  // FormGroup to control the parameters of a set model 
  parameterForm: FormGroup;

  // list of all available models, their parameters, default start values
  // an description text and which function to call to calculate said model
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
  
  // currently selected model
  selectedModel: genericModel;
  
  // selected data file
  selectedXYFile: Blob;

  constructor(
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    // at startup initialize the linspace from 0..1 with 10 steps
    this.linspaceForm = this.formBuilder.group({
      xMin: [0, [Validators.required]],
      xMax: [1, Validators.required],
      Nx: [10, Validators.required]
    }, { updateOn: 'blur' });

    // on user input, and if a model is selected, recalculate the model
    this.linspaceForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.linspaceForm.valid) {
        this.selectedModel.setFunction();
      }
    });
  }

  modelSelected() {
    // when the user selects a model, initalize the FormGroup for the parameters
    const paramGroup = {};
    for (const param of this.selectedModel.parameters) {
      paramGroup[param.name] = [param.value, Validators.required]
    }
    this.parameterForm = this.formBuilder.group(paramGroup, { updateOn: 'blur' });

    // when parameters are changed by the user
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

    // calculate the model once after selection
    this.selectedModel.setFunction();
  }

  calculate_linspace() {
    // calculate the linspace for given xMin, xMax and number of steps
    // only calculated if no data is selected
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
    // loading 2 or 3 column files
    const fileList: FileList = xyFileInput.target.files;
    if ( fileList.length > 0 ) {
      this.selectedXYFile = xyFileInput.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        // read the data
        const content = reader.result;
        const lines = String(content).split('\n');

        // initialize empty lists for the columns
        const x = [];
        const yData = [];
        const syData = [];

        // check lines for first non-empty line that's not a comment and see
        // if it has 2 or 3 columns
        let has_three_cols = false;
        for (let line of lines) {
          // ignore comments
          if (line.trim().startsWith('#')) continue

          // ignore empty lines
          if (line.trim().length > 0) {
            const splitted_line = line.split(/\s+/);
            has_three_cols = splitted_line.length >= 3;
          }
        }
        for (let line of lines) {
          // ignore comments
          if (line.trim().startsWith('#')) continue

          // split line at white-spaces or tabs
          const splitted_line = line.split(/\s+/)

          if (splitted_line.length >= 2) {
            x.push(Number(splitted_line[0]));
            yData.push(Number(splitted_line[1]));
            if (has_three_cols) {
              if (splitted_line.length >= 3) {
                syData.push(Number(splitted_line[2]));
              } else {
                throw "File identified as 3 column file has one line with only 2 columns"
              }
            }
          }
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

    let syData: Float64Array;
    if (this.syData.length === 0) {
      syData = new Float64Array(this.x.length);
      syData.fill(1);
    } else {
      syData = this.syData;
    }
    // run fit
    console.log('fitting with p_init:', p_init);
    let p_result = fit(this.selectedModel.name, p_init, this.x, this.yData, syData);
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
