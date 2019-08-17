import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogXLogYGraphComponent } from './logxlogygraph.component';

describe('LogXLogYGraphComponent', () => {
  let component: LogXLogYGraphComponent;
  let fixture: ComponentFixture<LogXLogYGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogXLogYGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogXLogYGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
