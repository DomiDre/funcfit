import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { XygraphComponent } from './xygraph.component';

describe('XygraphComponent', () => {
  let component: XygraphComponent;
  let fixture: ComponentFixture<XygraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ XygraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(XygraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
