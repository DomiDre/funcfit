import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { XydataLoaderService } from '@shared/services/xydata-loader.service';

import { FuncModel } from '@shared/models/funcModel.model';
import { FitStatistics } from '@shared/models/fitstatistics.model';
import { Parameter } from '@shared/models/parameter.model';

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

  checkboxKey = 'checkboxes';

  fit_worker: Worker;
  fit_running = false;
  fit_t0: number;

  constructor(
    private formBuilder: FormBuilder,
    private dataLoader: XydataLoaderService,
    private http: HttpClient) {
      if (typeof Worker !== 'undefined') {
        // initialize a worker from adder.worker.ts
        this.fit_worker = new Worker('../workers/rusfun.worker', { type: 'module' });

        // define behaviour when worker finishes his task
        this.fit_worker.onmessage = ({ data }) => {
          if (data.task === 'fit') {
            this.eval_fit_result(data.result);
          } else if (data.task === 'model') {
            this.eval_model_calc(data.result);
          }
        };
      } else {
        console.log('Web Workers are not supported in this environment');
      }
    }

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

    this.calc_model(this.selectedModel.name, p, x);
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

    // start fit
    this.fit_worker.postMessage({
      task: 'fit',
      modelName: this.selectedModel.name,
      p: pInit,
      x: this.x,
      y: this.yData,
      sy: syData,
      varyP
    });
    this.fit_running = true;
    this.fit_t0 = window.performance.now();
  }

  /**
   * Called once a fit from the worker is finished
   */
  eval_fit_result(fitResult) {
    const copyOfPInit = JSON.parse(JSON.stringify(this.selectedModel.parameters));
    const pResult: Parameter[] = [];
    for (const idx in fitResult.params) {
      if (fitResult.params[idx]) {
        const param = this.selectedModel.parameters[idx];
        param.value = fitResult.params[idx] / param.unitValue;
        param.std = fitResult.errors[idx] / param.unitValue;
        pResult.push(param);
      }
    }
    this.fitStatistics = {
      chi2: fitResult.chi2,
      redchi2: fitResult.redchi2,
      R2: fitResult.R2,
      pResult,
      pInit: copyOfPInit,
      fittedModel: fitResult.fitted_model,
      numFuncEvaluations: fitResult.numFuncEvaluations,
      executionTime: window.performance.now() - this.fit_t0,
      convergenceMessage: fitResult.convergenceMessage
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
      }
    }
    updatedVals[this.checkboxKey] = checkboxGroup;
    this.parameterForm.setValue(updatedVals);
  }

  /*
  * Generate text file with results that can be saved to disk
  */
  generate_result_file() {
    let data_present = this.yData.length > 0;
    let error_bars_present = this.syData.length > 0;
    let model_present = this.y.length > 0;

    const element = document.createElement('a');
    const current_date = new Date();
    let text = `# File generated on ${current_date.toLocaleDateString()} ${current_date.toTimeString()} \n`;
    if (model_present) {
      text += `# Used model: ${this.selectedModel.displayName} \n`;
    }
    if (this.fitStatistics) {
        text += `# Χ²: ${this.fitStatistics.chi2} \n` +
        `# Red. Χ²: ${this.fitStatistics.redchi2} \n` +
        `# R² : ${this.fitStatistics.R2} \n` +
        `# Func. Eval.: ${this.fitStatistics.numFuncEvaluations} \n` +
        `# Execution Time: ${this.fitStatistics.executionTime} ms \n` +
        `# Algorithm ended with: ${this.fitStatistics.convergenceMessage} \n` +
        `# Fitted parameters: \n`;
        for (const i in this.fitStatistics.pResult) {
          if (this.fitStatistics.pResult[i]) {
            const param = this.fitStatistics.pResult[i];
            if (param.vary) {
              text += `# ${param.name}\t=\t ${param.value} ± ${param.std} ` +
                      `${param.unitName} (${param.std / param.value * 100} %) ` +
                      `[init: ${this.fitStatistics.pInit[i].value}] \n`;
            }
          }
        }
        text += `# Fixed parameters: \n`;
        for (const param of this.fitStatistics.pResult) {
          if (!param.vary) {
            text += `# ${param.name}\t=\t ${param.value} ${param.unitName} \n`;
          }
        }
    } else if (model_present) {
      text += `# Parameters: \n`;
      for (const param of this.selectedModel.parameters) {
        text += `# ${param.name}\t=\t ${param.value} ${param.unitName} \n`;
      }
    }
    // generate header of data, check if data or model are present
    text += '\n';

    if (this.x.length > 0) {
      text += '# x';
      if (data_present) {
        text += '\ty_data';
        data_present = true;
        if (error_bars_present) {
          text += '\tsy_data';
          error_bars_present = true;
        }
      }
      if (model_present) {
        text += '\ty_model';
        model_present = true;
      }
      text += '\n';
      for (const i in this.x) {
        if (this.x[i]) {
          text += `${this.x[i]}`;
          if (data_present) {
            text += `\t${this.yData[i]}`;
            if (error_bars_present) {
              text += `\t${this.syData[i]}`;
            }
          }
          if (model_present) {
            text += `\t${this.y[i]}`;
          }
          text += '\n';
        }
      }
    }
    const fileName = 'funcfit_result.dat';
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', fileName);
    const event = new MouseEvent('click');
    element.dispatchEvent(event);
  }

  calc_model(modelName: string, p: Float64Array, x: Float64Array) {
    this.fit_worker.postMessage({
      task: 'model',
      modelName,
      p,
      x,
    });
  }

  eval_model_calc(result: Float64Array) {
    this.y = result;
  }

}
