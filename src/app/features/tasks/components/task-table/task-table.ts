import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  DestroyRef,
  inject,
  input,
  model
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskView } from '@core/models/Task';
import { TaskTableRow } from '@features/tasks/components/task-table-row/task-table-row';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { TaskTableFooter } from '../task-table-footer/task-table-footer';
import { UserService } from '@core/services/user/user.service';
import { UserModel } from '@core/models/UserModel'
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [
    CommonModule,
    TaskTableRow,
    EmptyState,
    TaskTableFooter,
    DragDropModule
  ],
  templateUrl: './task-table.html',
  styleUrl: './task-table.css'
})
export class TaskTable implements OnChanges {

  /* -------------------------------------------------------------------------- */
  /*                                   Inputs                                   */
  /* -------------------------------------------------------------------------- */

  @Input() tasks: TaskView[] = [];
  @Input() itemsPerPage = 5;
  @Input() currentPage = 1;
  @Input() sortField: 'title' | 'createdAt' = 'createdAt';
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() clearExpandedTrigger!: number;
  pageSizeOptions = input.required<readonly (number | string)[]>();
  selectedPageSize = model<number | 'All'>(5);

  /* -------------------------------------------------------------------------- */
  /*                                   Outputs                                  */
  /* -------------------------------------------------------------------------- */

  @Output() editTask = new EventEmitter<TaskView>();
  @Output() deleteTask = new EventEmitter<TaskView>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() sortByChange = new EventEmitter<'title' | 'createdAt'>();
  @Output() reorderTasks = new EventEmitter<TaskView[]>();
  @Output() pageSizeChangeTrigger = new EventEmitter<number | 'All'>();

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */

  users = input.required<UserModel[]>();

  /** 🔥 Reactive Map: taskId -> assigned users */
  taskAssignedUsersMapSig = computed(() => {
    const users = this.users();
    const userMap = new Map(users.map(u => [u.id, u]));
    const map = new Map<string, UserModel[]>();

    this.tasks.forEach(task => {
      const assigned = task.assignedTo
        .map(id => userMap.get(id))
        .filter((u): u is UserModel => !!u);

      map.set(task.id, assigned);
    });

    return map;
  });

  totalPages = 1;
  pagedTasks: TaskView[] = [];

  private updatePagedTasks(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.totalPages = Math.ceil(this.tasks.length / this.itemsPerPage) || 1;
    this.pagedTasks = this.tasks.slice(start, end);
  }

  constructor(private userService: UserService) { }

  /* -------------------------------------------------------------------------- */
  /*                                  Lifecycle                                 */
  /* -------------------------------------------------------------------------- */


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.updatePagedTasks(); // mapping auto-updates via signal
    }

    if (changes['currentPage'] || changes['itemsPerPage']) {
      this.updatePagedTasks();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                Event Handlers                              */
  /* -------------------------------------------------------------------------- */

  onEdit(task: TaskView): void {
    this.editTask.emit(task);
  }

  onDelete(task: TaskView): void {
    this.deleteTask.emit(task);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedTasks();
    this.pageChange.emit(page);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  onSortBy(field: 'title' | 'createdAt'): void {
    this.sortByChange.emit(field);
  }

  drop(event: CdkDragDrop<TaskView[]>) {
    if (event.previousIndex === event.currentIndex) return;

    const globalPrevIndex =
      (this.currentPage - 1) * this.itemsPerPage + event.previousIndex;

    const globalCurrIndex =
      (this.currentPage - 1) * this.itemsPerPage + event.currentIndex;

    moveItemInArray(this.tasks, globalPrevIndex, globalCurrIndex);
    this.updatePagedTasks();
    this.reorderTasks.emit(this.tasks);
  }
}