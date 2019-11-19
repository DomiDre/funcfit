/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  import('rusfun')
  .then(module => {
    if (data.task === 'fit') {
      const fitResult = module.fit(
        data.modelName,
        data.p,
        data.x,
        data.y,
        data.sy,
        data.varyP);

      postMessage({
        task: 'fit',
        result: {
          params: fitResult.parameters(),
          errors: fitResult.parameter_std_errors(),
          chi2: fitResult.chi2(),
          redchi2: fitResult.redchi2(),
          R2: fitResult.R2(),
          fittedModel: fitResult.fitted_model(),
          numFuncEvaluations: fitResult.num_func_evaluation(),
          convergenceMessage: fitResult.convergence_message()
        }
      });
    } else if (data.task === 'model') {
      const result = module.model(
        data.modelName,
        data.p,
        data.x);
      postMessage({
        task: 'model',
        result
      });
    }
  });
});
