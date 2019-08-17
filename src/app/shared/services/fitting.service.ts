import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { XydataLoaderService } from '@shared/services/xydata-loader.service';

import { FuncModel } from '@shared/models/funcModel.model';
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

  models: FuncModel[];
  // currently selected model
  selectedModel: FuncModel;

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
  modelCalc: (functionName: string, p: Float64Array, x: Float64Array) => Float64Array;

  // Function that fits model parameters to data
  fitRoutine: (modelname: string, p: Float64Array, x: Float64Array,
               y: Float64Array, sy: Float64Array, varyP: Uint8Array) => FitResult;

  checkboxKey = 'checkboxes';

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
      if (this.selectedModel && this.linspaceForm.valid) {
        this.setFunction();
      }
    });
  }

  setModels(models: FuncModel[]) {
    this.models = models;
  }

  loadXYData(xyFileInput) {
    // loading 2 or 3 column files
    const fileList: FileList = xyFileInput.target.files;
    if ( fileList.length > 0 ) {
      this.selectedXYFile = xyFileInput.target.files[0];
      this.dataLoader.readFile(this.selectedXYFile)
      .then(fileContent => {
        if (fileContent && fileContent.x && fileContent.x.length > 0) {
          this.linspaceForm.disable();
          this.x = fileContent.x;
          this.yData = fileContent.y;
          this.syData = fileContent.sy;

          // sort arrays according to x
          const zip = [];
          for (let i = 0; i < this.x.length; i++) {
            zip.push([this.x[i], this.yData[i], this.syData[i]]);
          }
          zip.sort((a, b) => a[0] - b[0]);
          for (let i = 0; i < zip.length; i++) {
            this.x[i] = zip[i][0];
            this.yData[i] = zip[i][1];
            this.syData[i] = zip[i][2];
          }
          if (this.selectedModel) { this.setFunction(); }
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
      ];
      checkboxGroup[param.name] = [
        {value: param.vary, disabled: !param.vary},
        Validators.required];
      this.fittableParameters[param.name] = param.vary;
    }
    paramGroup[this.checkboxKey] = this.formBuilder.group(checkboxGroup);
    this.parameterForm = this.formBuilder.group(
      paramGroup,
      // { updateOn: 'blur' }
    );

    // when parameters are changed by the user
    // update internal parameters and update the plot
    this.parameterForm.valueChanges
    .subscribe(val => {
      if (this.selectedModel && this.parameterForm.valid) {
        for (const param of this.selectedModel.parameters) {
          param.value = val[param.name];
          param.vary = val.checkboxes[param.name];
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
    const p = new Float64Array(this.selectedModel.parameters.length);
    for (const idx in this.selectedModel.parameters) {
      if (this.selectedModel.parameters[idx]) {
        const param = this.selectedModel.parameters[idx];
        p[idx] = param.value * param.unitValue;
      }
    }
    const x = new Float64Array(this.x);
    this.y = this.modelCalc(this.selectedModel.name, p, x);
  }

  calculate_linspace() {
    // calculate the linspace for given xMin, xMax and number of steps
    // only calculated if no data is selected
    if (this.yData.length === 0) {
      const x = [];
      const xMin = Number(this.linspaceForm.controls.xMin.value);
      const xMax = Number(this.linspaceForm.controls.xMax.value);
      const N = Number(this.linspaceForm.controls.Nx.value);
      const step = (xMax - xMin) / (N - 1);
      for (let i = 0; i < N; i++) {
        x.push(xMin + i * step);
      }
      this.x = new Float64Array(x);
    }
  }


  load_example_data() {
    this.http.get('assets/gaussianData.xye', {responseType: 'text'})
    .subscribe(data => {
      const fileContent = this.dataLoader.parseColumnFileContent(data);
      if (fileContent && fileContent.x && fileContent.x.length > 0) {
        this.linspaceForm.disable();
        this.x = fileContent.x;
        this.yData = fileContent.y;
        this.syData = fileContent.sy;
        if (this.selectedModel) { this.setFunction(); }
      }
    });
  }

  run_fit() {
    // initialize parameter array
    const pInit: Float64Array = new Float64Array(this.selectedModel.parameters.length);
    const varyP: Uint8Array = new Uint8Array(this.selectedModel.parameters.length);
    for (const i in this.selectedModel.parameters) {
      if (this.selectedModel.parameters[i]) {
        const param = this.selectedModel.parameters[i];
        pInit[i] = param.value * param.unitValue;
        varyP[i] = +param.vary;
      }
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
    const fitResult = this.fitRoutine(
      this.selectedModel.name, pInit,
      this.x, this.yData, syData, varyP);
    const t1 = window.performance.now();
    const executionTime = (t1 - t0);

    const params = fitResult.parameters();
    const errors = fitResult.parameter_std_errors();

    const pResult: Parameter[] = [];
    for (const idx in params) {
      if (params[idx]) {
        const param = this.selectedModel.parameters[idx];
        param.value = params[idx] / param.unitValue;
        param.std = errors[idx] / param.unitValue;
        pResult.push(param);
      }
    }
    this.fitStatistics = {
      chi2: fitResult.chi2(),
      redchi2: fitResult.redchi2(),
      pResult,
      numFuncEvaluations: fitResult.num_func_evaluation(),
      executionTime,
      convergenceMessage: fitResult.convergence_message()
    };
    // update parameter array and plot new model
    const updatedVals = {};
    const checkboxGroup = {};
    for (const i in this.selectedModel.parameters) {
      if (this.selectedModel.parameters[i]) {
        const param = this.selectedModel.parameters[i];
        // const new_param_values = pResult[i];
        // param.value = new_param_values.value;
        // param.vary = new_param_values.vary;
        updatedVals[param.name] = param.value;
        if (this.fittableParameters[param.name]) {
          checkboxGroup[param.name] = param.vary;
        } else {
          checkboxGroup[param.name] = false;
        }
        updatedVals[this.checkboxKey] = checkboxGroup;
        this.parameterForm.setValue(updatedVals);
      }
    }
  }

}
