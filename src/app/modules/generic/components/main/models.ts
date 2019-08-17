import { funcModel } from '@shared/models/funcModel.model';

// list of all available models, their parameters, default start values
// an description text and which function to call to calculate said model
export const models: funcModel[] = [
	{
		name: 'linear',
		displayName: 'Linear',
		parameters: [{
			name: 'a',
			value: 1,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}, {
			name: 'b',
			value: 0,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}],
		infoText: 'Function:\na*x + b',
	},
	{
		name: 'parabola',
		displayName: 'Parabola',
		parameters: [{
			name: 'a',
			value: 1,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}, {
			name: 'b',
			value: 0,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}, {
			name: 'c',
			value: 0,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}],
		infoText: 'Function:\na*x^2 + b*x + c',
	},
	{
		name: 'gaussian',
		displayName: 'Gaussian',
		parameters: [{
			name: 'A',
			value: 1,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: 0,
			max: Infinity
		}, {
			name: 'μ',
			value: 0.5,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}, {
			name: 'σ',
			value: 0.1,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: 0,
			max: Infinity
		}, {
			name: 'c',
			value: 0,
			vary: true,
			unitName: '',
			unitValue: 1,
			min: -Infinity,
			max: Infinity
		}],
		infoText: 'Function:\nA*exp( - ½((x - μ)/σ)² ) + c',
	}
];
