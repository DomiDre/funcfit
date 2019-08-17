import { TestBed } from '@angular/core/testing';

import { FittingService } from './fitting.service';

describe('FittingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FittingService = TestBed.get(FittingService);
    expect(service).toBeTruthy();
  });
});
