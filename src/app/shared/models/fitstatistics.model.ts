import { Parameter } from './parameter.model';

export class FitStatistics {
  chi2: number;
  redchi2: number;
  pResult: Parameter[];
  numFuncEvaluations: number;
  executionTime: number;
  convergenceMessage: string;
}
