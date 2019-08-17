import { Parameter } from './parameter.model';

export class FitStatistics {
  chi2: number;
  redchi2: number;
  p_result: Parameter[];
  num_func_eval: number;
  execution_time: number;
  convergence_message: string;
}
