import { TestBed } from '@angular/core/testing';

import { XydataLoaderService } from './xydata-loader.service';

describe('XydataLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: XydataLoaderService = TestBed.get(XydataLoaderService);
    expect(service).toBeTruthy();
  });
});
