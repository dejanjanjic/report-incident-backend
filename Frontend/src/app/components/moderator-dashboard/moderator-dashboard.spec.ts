import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeratorDashboard } from './moderator-dashboard';

describe('ModeratorDashboard', () => {
  let component: ModeratorDashboard;
  let fixture: ComponentFixture<ModeratorDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeratorDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModeratorDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
