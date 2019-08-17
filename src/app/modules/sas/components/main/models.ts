import { FuncModel } from '@shared/models/funcModel.model';

// list of all available models, their parameters, default start values
// an description text and which function to call to calculate said model
export const models: FuncModel[] = [
  {
    name: 'sas_sphere',
    displayName: 'Sphere',
    parameters: [{
      name: 'I0',
      value: 1,
      vary: true,
      unitName: 'cm⁻¹',
      unitValue: 1,
      min: 0,
      max: 10
    }, {
      name: 'R',
      value: 50,
      vary: true,
      unitName: 'Å',
      unitValue: 1,
      min: 0,
      max: Infinity
    }, {
      name: 'σ_R',
      value: 10,
      vary: true,
      unitName: '%',
      unitValue: 1e-2,
      min: 0,
      max: 30
    }, {
      name: 'SLD_sphere',
      value: 40,
      vary: false,
      unitName: '10⁻⁶ Å⁻²',
      unitValue: 1e-6,
      min: -100,
      max: 100
    }, {
      name: 'SLD_matrix',
      value: 10,
      vary: false,
      unitName: '10⁻⁶ Å⁻²',
      unitValue: 1e-6,
      min: -100,
      max: 100
    }, {
      name: 'Gauss-Hermite Degree',
      value: 20,
      vary: false,
      unitName: '',
      unitValue: 1,
      min: 1,
      max: 100
    }],
    infoText: 'Function:\n P(q) = ΔSLD²·∫V²·F(q)² g(R, σ_R) dR\nF(q) = 3[sin(qR) - qRcos(qR)]/(qR)³\ng(μ, σ): Lognormal Distr.',
  },
  {
    name: 'sas_cube',
    displayName: 'Cube',
    parameters: [{
      name: 'I0',
      value: 1,
      vary: true,
      unitName: 'cm⁻¹',
      unitValue: 1,
      min: 0,
      max: 10
    }, {
      name: 'a',
      value: 50,
      vary: true,
      unitName: 'Å',
      unitValue: 1,
      min: 0,
      max: Infinity
    }, {
      name: 'σ_a',
      value: 10,
      vary: true,
      unitName: '%',
      unitValue: 1e-2,
      min: 0,
      max: 30
    }, {
      name: 'SLD_cube',
      value: 40,
      vary: false,
      unitName: '10⁻⁶ Å⁻²',
      unitValue: 1e-6,
      min: -100,
      max: 100
    }, {
      name: 'SLD_matrix',
      value: 10,
      vary: false,
      unitName: '10⁻⁶ Å⁻²',
      unitValue: 1e-6,
      min: -100,
      max: 100
    }, {
      name: 'Gauss-Legendre Degree',
      value: 20,
      vary: false,
      unitName: '',
      unitValue: 1,
      min: 1,
      max: 100
    }, {
      name: 'Gauss-Hermite Degree',
      value: 20,
      vary: false,
      unitName: '',
      unitValue: 1,
      min: 1,
      max: 100
    }],
    infoText: 'Function:\n P(q) = ΔSLD²·∫V²·F(q)²·g(a, σ_a) da\nF(q) = ∫∫ sinc(q_x·a)·sinc(q_y·a)·sinc(q_z·a)dΩ\ng(μ, σ): Lognormal Distr.',
  }
];
