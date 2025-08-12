import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeratorIncidentMap } from './moderator-incident-map';

describe('ModeratorIncidentMap', () => {
  let component: ModeratorIncidentMap;
  let fixture: ComponentFixture<ModeratorIncidentMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeratorIncidentMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModeratorIncidentMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
