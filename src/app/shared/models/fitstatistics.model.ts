import { Parameter } from './parameter.model';

export class FitStatistics {
  chi2: number;
  redchi2: number;
  R2: number;
  pResult: Parameter[];
  pInit: Parameter[];
  fittedModel: Float64Array;
  numFuncEvaluations: number;
  executionTime: number;
  convergenceMessage: string;
}
