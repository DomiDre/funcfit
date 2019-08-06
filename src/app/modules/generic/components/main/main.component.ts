import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { model, fit } from 'rusfun';
import { XydataLoaderService } from '@shared/services/xydata-loader.service';
import { HttpClient } from '@angular/common/http';

class Parameter {
  name: string;
  value: number;
  std?: number;
}
class genericModel {
  name: string;
  displayName: string;
  parameters: Parameter[];
  infoText: string;
}

class FitStatistics {
  chi2: number;
  redchi2: number;
  p_result: Parameter[];
  num_func_eval: number;
  execution_time: number;
  convergence_message: string;
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
    },
    {
      name: 'gaussian',
      displayName: 'Gaussian',
      parameters: [{
        name: 'A',
        value: 1
      }, {
        name: 'μ',
        value: 0.5
      }, {
        name: 'σ',
        value: 0.1
      }, {
        name: 'c',
        value: 0
      }],
      infoText: 'Function:\nA*exp( - ½((x - μ)/σ)² ) + c',
    }
  ]
  
  // currently selected model
  selectedModel: genericModel;
  
  // selected data file
  selectedXYFile: Blob;

  // in case a fit was performed, for display of fit statistics
  fitStatistics: FitStatistics;

  constructor(
    private formBuilder: FormBuilder,
    private dataLoader: XydataLoaderService,
    private http: HttpClient) { }

  ngOnInit() {
    // at startup initialize the linspace from 0..1 with 10 steps
    this.linspaceForm = this.formBuilder.group({
      xMin: [0, [Validators.required]],
      xMax: [1, Validators.required],
      Nx: [100, Validators.required]
    }, { updateOn: 'blur' });

    // on user input, and if a model is selected, recalculate the model
    this.linspaceForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.linspaceForm.valid) {
        this.setFunction();
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
        this.setFunction();
      }
    });

    // calculate the model once after selection
    this.setFunction();
  }

  setFunction() {
    // calls function from wasm and sets result in y
    this.calculate_linspace();
    let p = new Float64Array(this.selectedModel.parameters.length);
    for (let idx in this.selectedModel.parameters) {
      p[idx] = this.selectedModel.parameters[idx].value;
    }
    let x = new Float64Array(this.x);
    this.y = model(this.selectedModel.name, p, x);
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

  loadXYData(xyFileInput) {
    // loading 2 or 3 column files
    const fileList: FileList = xyFileInput.target.files;
    if ( fileList.length > 0 ) {
      this.selectedXYFile = xyFileInput.target.files[0];
      this.dataLoader.readFile(this.selectedXYFile)
      .then(file_content => {
        if (file_content && file_content.x && file_content.x.length > 0) {
          this.linspaceForm.disable();
          this.x = file_content.x;
          this.yData = file_content.y;
          this.syData = file_content.sy;
          if(this.selectedModel) this.setFunction();
        }
      });
    }
  }

  load_example_data() {
    this.http.get('assets/gaussianData.xye', {responseType: 'text'})
    .subscribe(data => {
      const file_content = this.dataLoader.parseColumnFileContent(data);
      if (file_content && file_content.x && file_content.x.length > 0) {
        this.linspaceForm.disable();
        this.x = file_content.x;
        this.yData = file_content.y;
        this.syData = file_content.sy;
        if(this.selectedModel) this.setFunction();
      }
    });
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
    
    const t0 = window.performance.now();
    const fit_result = fit(this.selectedModel.name, p_init, this.x, this.yData, syData);
    const t1 = window.performance.now();
    const execution_time = (t1 - t0);

    const p_params = fit_result.parameters();
    const p_errors = fit_result.parameter_std_errors();
    let p_result: Parameter[] = [];
    for (let idx in p_params) {
      p_result.push({
        name: this.selectedModel.parameters[idx].name,
        value: p_params[idx],
        std: p_errors[idx]
      });
    }
    this.fitStatistics = {
      chi2: fit_result.chi2(),
      redchi2: fit_result.redchi2(),
      p_result: p_result,
      num_func_eval: fit_result.num_func_evaluation(),
      execution_time: execution_time,
      convergence_message: fit_result.convergence_message()
    }
    // update parameter array and plot new model
    let updated_vals = {};
    for (let i in this.selectedModel.parameters) {
      let param = this.selectedModel.parameters[i];
      param.value = p_params[i];
      updated_vals[param.name] = param.value;
    }
    this.parameterForm.setValue(updated_vals);
  }
}
