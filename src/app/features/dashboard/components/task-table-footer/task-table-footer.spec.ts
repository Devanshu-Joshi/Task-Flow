import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskTableFooter } from './task-table-footer';

describe('TaskTableFooter', () => {
  let component: TaskTableFooter;
  let fixture: ComponentFixture<TaskTableFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskTableFooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskTableFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
