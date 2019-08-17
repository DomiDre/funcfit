import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { XydataLoaderService } from '@shared/services/xydata-loader.service';

import { funcModel } from '@shared/models/funcModel.model';
import { FitStatistics } from '@shared/models/fitstatistics.model';
import { Parameter } from '@shared/models/parameter.model';
import { FitResult } from 'rusfun';

@Injectable({
  providedIn: 'root'
})
export class FittingService {
  // for compatibility with rusfun code, store data in Float64Arrays
  x: Float64Array = new Float64Array([]);
  y: Float64Array = new Float64Array([]);
  yData: Float64Array = new Float64Array([]);
  syData: Float64Array = new Float64Array([]);

  models: funcModel[];
  // currently selected model
  selectedModel: funcModel;

  // map which parameters of current model can generally be fitted
  // extracted from the default values
  fittableParameters: { [key: string]: boolean } = {};

  // selected data file
  selectedXYFile: Blob;

  // in case a fit was performed, for display of fit statistics
  fitStatistics: FitStatistics;

  // FormGroup to control the linspace if no data is present
  linspaceForm: FormGroup;

  // FormGroup to control the parameters of a set model 
  parameterForm: FormGroup;

  // Function that takes modelname, parameter and x and calculates y
  modelCalc: (function_name: string, p: Float64Array, x: Float64Array) => Float64Array;

  // Function that fits model parameters to data
  fitRoutine: (modelname: string, p: Float64Array, x: Float64Array,
    y: Float64Array, sy: Float64Array, vary_p: Uint8Array) => FitResult;

  constructor(
    private formBuilder: FormBuilder,
    private dataLoader: XydataLoaderService,
    private http: HttpClient) { }
  
  initLinspaceGroups(xmin: number, xmax: number, Nx: number) {
    // at startup initialize the linspace
    this.linspaceForm = this.formBuilder.group({
      xMin: [xmin, [Validators.required]],
      xMax: [xmax, Validators.required],
      Nx: [Nx, Validators.required]
    }, { updateOn: 'blur' });

    // on user input, and if a model is selected, recalculate the model
    this.linspaceForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.linspaceForm.valid) {
        this.setFunction();
      }
    });
  }

  setModels(models: funcModel[]) {
    this.models = models;
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

          // sort arrays according to x
          let zip = [];
          for (let i = 0; i < this.x.length; i++) {
            zip.push([this.x[i], this.yData[i], this.syData[i]]);
          }
          zip.sort((a, b) => { return a[0] - b[0]; });
          for (let i = 0; i < zip.length; i++) {
            this.x[i] = zip[i][0];
            this.yData[i] = zip[i][1];
            this.syData[i] = zip[i][2];
          }
          if(this.selectedModel) this.setFunction();
        }
      });
    }
  }

  modelSelected() {
    // when the user selects a model, initalize the FormGroup for the parameters
    const paramGroup = {};
    const checkboxGroup = {};
    for (const param of this.selectedModel.parameters) {
      paramGroup[param.name] = [
        param.value, 
        [
          Validators.required,
          Validators.min(param.min),
          Validators.max(param.max),
        ]
      ]
      checkboxGroup[param.name] = [
        {value: param.vary, disabled: !param.vary},
        Validators.required]
      this.fittableParameters[param.name] = param.vary;
    }
    paramGroup['checkboxes'] = this.formBuilder.group(checkboxGroup);
    this.parameterForm = this.formBuilder.group(
      paramGroup,
      // { updateOn: 'blur' }
    );

    // when parameters are changed by the user
    // update internal parameters and update the plot
    this.parameterForm.valueChanges
    .subscribe(val => {
      if(this.selectedModel && this.parameterForm.valid) {
        for (let param of this.selectedModel.parameters) {
          param.value = val[param.name];
          param.vary = val['checkboxes'][param.name];
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
      const param = this.selectedModel.parameters[idx];
      p[idx] = param.value * param.unitValue;
    }
    let x = new Float64Array(this.x);
    this.y = this.modelCalc(this.selectedModel.name, p, x);
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
    let vary_p: Uint8Array = new Uint8Array(this.selectedModel.parameters.length);
    for (let i in this.selectedModel.parameters) {
      const param = this.selectedModel.parameters[i];
      p_init[i] = param.value * param.unitValue;
      vary_p[i] = +param.vary;
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
    const fit_result = this.fitRoutine(
      this.selectedModel.name, p_init,
      this.x, this.yData, syData, vary_p);
    const t1 = window.performance.now();
    const execution_time = (t1 - t0);

    const p_params = fit_result.parameters();
    const p_errors = fit_result.parameter_std_errors();
    
    let p_result: Parameter[] = [];
    for (let idx in p_params) {
      const param = this.selectedModel.parameters[idx];
      param.value = p_params[idx] / param.unitValue;
      param.std = p_errors[idx] / param.unitValue;
      p_result.push(param);
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
    const updated_vals = {};
    const checkboxGroup = {};
    for (let i in this.selectedModel.parameters) {
      let param = this.selectedModel.parameters[i];
      // const new_param_values = p_result[i];
      // param.value = new_param_values.value;
      // param.vary = new_param_values.vary;
      updated_vals[param.name] = param.value;
      if (this.fittableParameters[param.name]) {
        checkboxGroup[param.name] = param.vary;
      } else {
        checkboxGroup[param.name] = false;
      }
    }
    updated_vals['checkboxes'] = checkboxGroup;
    this.parameterForm.setValue(updated_vals);
  }

}
