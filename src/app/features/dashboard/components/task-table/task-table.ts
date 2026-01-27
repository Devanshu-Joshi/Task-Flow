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
import { NgxPaginationModule } from 'ngx-pagination';

import { TaskView } from '@core/models/Task';
import { TaskTableRow } from '@features/dashboard/components/task-table-row/task-table-row';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { TaskTableFooter } from '../task-table-footer/task-table-footer';
import { UserService } from '@core/services/user/user.service';
import { UserModel } from '@core/models/UserModel';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [
    CommonModule,
    NgxPaginationModule,
    TaskTableRow,
    EmptyState,
    TaskTableFooter
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

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */

  users: UserModel[] = [];

  /** Map: taskId -> assigned users */
  taskAssignedUsersMap = new Map<string, UserModel[]>();

  constructor(private userService: UserService) { }

  /* -------------------------------------------------------------------------- */
  /*                                  Lifecycle                                 */
  /* -------------------------------------------------------------------------- */

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] && this.users.length) {
      this.mapAllTasksAssignedUsers();
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
    this.pageChange.emit(page);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  onSortBy(field: 'title' | 'createdAt'): void {
    this.sortByChange.emit(field);
  }
}