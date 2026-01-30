import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskView } from '@core/models/Task';
import { TaskTableRow } from '@features/tasks/components/task-table-row/task-table-row';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { TaskTableFooter } from '../task-table-footer/task-table-footer';
import { UserService } from '@core/services/user/user.service';
import { UserModel } from '@core/models/UserModel'
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
export class TaskTable implements OnInit, OnChanges {

  /* -------------------------------------------------------------------------- */
  /*                                   Inputs                                   */
  /* -------------------------------------------------------------------------- */

  @Input() tasks: TaskView[] = [];
  @Input() itemsPerPage = 5;
  @Input() currentPage = 1;
  @Input() sortField: 'title' | 'createdAt' = 'createdAt';
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() clearExpandedTrigger!: number;

  /* -------------------------------------------------------------------------- */
  /*                                   Outputs                                  */
  /* -------------------------------------------------------------------------- */

  @Output() editTask = new EventEmitter<TaskView>();
  @Output() deleteTask = new EventEmitter<TaskView>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() sortByChange = new EventEmitter<'title' | 'createdAt'>();
  @Output() reorderTasks = new EventEmitter<TaskView[]>();

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */

  users: UserModel[] = [];

  /** Map: taskId -> assigned users */
  taskAssignedUsersMap = new Map<string, UserModel[]>();

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

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['tasks']) {
      if (this.users.length) {
        this.mapAllTasksAssignedUsers();
      }
      this.updatePagedTasks();
    }

    if (changes['currentPage'] || changes['itemsPerPage']) {
      this.updatePagedTasks();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Methods                                  */
  /* -------------------------------------------------------------------------- */

  private loadUsers(): void {
    this.userService.getUsersByParent().subscribe({
      next: (users) => {
        this.users = users;
        this.mapAllTasksAssignedUsers();
        this.updatePagedTasks();
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  private mapAllTasksAssignedUsers(): void {
    this.taskAssignedUsersMap.clear();

    const userMap = new Map(this.users.map(user => [user.id, user]));

    this.tasks.forEach(task => {
      const assignedUsers = task.assignedTo
        .map(id => userMap.get(id))
        .filter((u): u is UserModel => !!u);

      this.taskAssignedUsersMap.set(task.id, assignedUsers);
    });
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

    // Convert page index → global index
    const globalPrevIndex =
      (this.currentPage - 1) * this.itemsPerPage + event.previousIndex;

    const globalCurrIndex =
      (this.currentPage - 1) * this.itemsPerPage + event.currentIndex;

    // Reorder MASTER array
    moveItemInArray(this.tasks, globalPrevIndex, globalCurrIndex);

    // Rebuild current page
    this.updatePagedTasks();

    // 🔥 Tell parent to persist new order
    this.reorderTasks.emit(this.tasks);
  }

}