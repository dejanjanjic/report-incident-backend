import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentMap } from './incident-map';

describe('IncidentMap', () => {
  let component: IncidentMap;
  let fixture: ComponentFixture<IncidentMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
