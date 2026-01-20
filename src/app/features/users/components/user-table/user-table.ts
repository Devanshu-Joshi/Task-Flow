import {
  Component,
  computed,
  inject,
  input,
  Input,
  model,
  Signal,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import { TaskView } from '@core/models/Task';
import { TaskStatus } from '@features/dashboard/pages/dashboard/dashboard';
import { PermissionItem } from '@core/models/PermissionItem';

import dayjs from 'dayjs';

import { EmptyState } from '../empty-state/empty-state';

import { NgxPaginationModule } from 'ngx-pagination';
import { UserModel } from '@core/models/User';
import { PermissionKey } from '@core/models/PermissionKey';

@Component({
  selector: 'app-user-table',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    NgxDaterangepickerMd,
    NgxPaginationModule,
    EmptyState
  ],
  templateUrl: './user-table.html',
  styleUrl: './user-table.css',
})
export class UserTable {
  deleteUser(arg0: string) {
    throw new Error('Method not implemented.');
  }
  editUser(_t93: UserModel) {
    throw new Error('Method not implemented.');
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Injections                                 */
  /* -------------------------------------------------------------------------- */

  fb = inject(FormBuilder);
  users = input<UserModel[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                               Form Controls                                */
  /* -------------------------------------------------------------------------- */

  searchControl: FormControl = new FormControl('');

  taskForm = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],
    dueDate: ['', Validators.required],
    status: ['Incomplete' as TaskStatus, Validators.required]
  });

  /* -------------------------------------------------------------------------- */
  /*                                 Signals                                    */
  /* -------------------------------------------------------------------------- */

  searchTerm = signal('');
  selectedRole = signal<string | null>(null);
  dateRange = signal<{ startDate: any; endDate: any } | null>(null);

  sortField = signal<'title' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  selectedPageSize = model<number | 'All'>(5);

  /* -------------------------------------------------------------------------- */
  /*                                Pagination                                  */
  /* -------------------------------------------------------------------------- */

  itemsPerPage = 5;
  p: number = 1;
  isTasksDropdownOpen = false;

  pageSizeOptions = [5, 10, 20, 'All'] as const;

  totalItems = computed(() => this.filteredTasks().length);

  /* -------------------------------------------------------------------------- */
  /*                                   Data                                     */
  /* -------------------------------------------------------------------------- */

  tasks = signal<TaskView[]>([]);

  roleOptions = [
    { label: 'All', value: null },
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'User', value: 'ROLE_USER' },
    { label: 'Guest', value: 'ROLE_GUEST' }
  ];

  permissions: PermissionItem[] = [
    {
      key: PermissionKey.TASK_VIEW,
      label: 'View Tasks',
      group: 'Task Management',
      description: 'Allows viewing tasks'
    },
    {
      key: PermissionKey.TASK_CREATE,
      label: 'Create Tasks',
      group: 'Task Management',
      description: 'Allows creating new tasks'
    },
    {
      key: PermissionKey.TASK_EDIT,
      label: 'Edit Tasks',
      group: 'Task Management',
      description: 'Allows editing existing tasks'
    },
    {
      key: PermissionKey.TASK_DELETE,
      label: 'Delete Tasks',
      group: 'Task Management',
      description: 'Allows deleting tasks'
    },
    {
      key: PermissionKey.MANAGE_USER,
      label: 'Manage Users',
      group: 'User Management',
      description: 'Allows managing users and their permissions'
    }
  ];

  selectedPermissions: string[] = [];

  /* -------------------------------------------------------------------------- */
  /*                                 Lifecycle                                  */
  /* -------------------------------------------------------------------------- */

  ngOnInit(): void {
    this.selectedPermissions = this.permissions.map(p => p.key);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Permissions Logic                               */
  /* -------------------------------------------------------------------------- */

  get allPermissionKeys(): string[] {
    return this.permissions.map(p => p.key);
  }

  isAllSelected(): boolean {
    return (
      this.selectedPermissions.length === this.allPermissionKeys.length &&
      this.allPermissionKeys.every(k =>
        this.selectedPermissions.includes(k)
      )
    );
  }

  toggleAll(checked: boolean): void {
    this.selectedPermissions = checked
      ? [...this.allPermissionKeys]
      : [];
  }

  onSelectionChange(): void {
    this.selectedPermissions = this.selectedPermissions.filter(k =>
      this.allPermissionKeys.includes(k)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Date Picker                                   */
  /* -------------------------------------------------------------------------- */

  toggleDatePicker(): void {
    const picker = document.querySelector(
      '.md-drppicker'
    ) as HTMLElement;

    if (picker.classList.contains('shown')) {
      picker.classList.remove('shown');
      picker.classList.add('hidden');
    } else {
      picker.classList.remove('hidden');
      picker.classList.add('shown');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Pagination Logic                               */
  /* -------------------------------------------------------------------------- */

  onPageSizeChange(value: number | 'All'): void {
    this.selectedPageSize.set(value);
    this.setItemsPerPage(value);
  }

  setItemsPerPage(value: number | 'All'): void {
    this.itemsPerPage =
      value === 'All' ? this.totalItems() : value;

    this.p = 1;
    this.isTasksDropdownOpen = false;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Filtering & Sorting                            */
  /* -------------------------------------------------------------------------- */

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedRole();
    const range = this.dateRange();
    const sortField = this.sortField();
    const sortDirection = this.sortDirection();

    const filtered = this.tasks().filter(task => {

      const matchesSearch =
        !term || task.title.toLowerCase().includes(term);

      const matchesStatus =
        !status || task.status === status;

      let matchesDate = true;

      if (range?.startDate && range?.endDate) {
        const taskDate = dayjs(task.dueDate).format('YYYY-MM-DD');
        const startDate = dayjs(range.startDate).format('YYYY-MM-DD');
        const endDate = dayjs(range.endDate).format('YYYY-MM-DD');

        matchesDate =
          taskDate >= startDate &&
          taskDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      return sortDirection === 'asc'
        ? valA > valB ? 1 : -1
        : valA < valB ? 1 : -1;
    });
  });

  sortBy(field: 'title' | 'createdAt') {
    if (this.sortField() === field) {
      this.sortDirection.set(
        this.sortDirection() === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Dialog Logic                                  */
  /* -------------------------------------------------------------------------- */

  isDialogClosed: boolean = true;

  toggleDialog(): void {
    this.isDialogClosed = !this.isDialogClosed;

    document.body.classList.toggle(
      'body-lock',
      !this.isDialogClosed
    );

    if (this.isDialogClosed) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'Incomplete'
    });

    this.taskForm.enable();
  }

}