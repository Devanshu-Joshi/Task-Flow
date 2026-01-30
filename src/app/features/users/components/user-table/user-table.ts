import {
  Component,
  computed,
  EventEmitter,
  inject,
  DestroyRef,
  Input,
  input,
  model,
  Output,
  signal,
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
import { TaskStatus } from '@features/tasks/pages/tasks/tasks';
import { PermissionItem } from '@core/models/PermissionItem';

import dayjs from 'dayjs';

import { EmptyState } from '@shared/components/empty-state/empty-state';

import { NgxPaginationModule } from 'ngx-pagination';
import { UserModel } from '@core/models/UserModel';
import { PermissionKey } from '@core/models/PermissionKey';
import { UserService } from '@core/services/user/user.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserAuth } from '@core/services/user-auth/user-auth';

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

  constructor(private userService: UserService, private toastr: ToastrService, private authService: UserAuth) { }

  @Output() addUser = new EventEmitter<void>();
  @Output() viewUser = new EventEmitter<UserModel>();
  @Output() editUser = new EventEmitter<UserModel>();
  @Output() deleteUser = new EventEmitter<UserModel>();


  deleteUserMethod(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.toastr.success("User Deleted Successfully", "Action Confirmed")
      },
      error: (err) => console.error(err)
    })
  }
  editUserMethod(_t93: UserModel) {
    throw new Error('Method not implemented.');
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Injections                                 */
  /* -------------------------------------------------------------------------- */

  fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  @Input() users$!: Observable<UserModel[]>;
  users = signal<UserModel[]>([]);

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
    status: ['INCOMPLETE' as TaskStatus, Validators.required]
  });

  /* -------------------------------------------------------------------------- */
  /*                                 Signals                                    */
  /* -------------------------------------------------------------------------- */

  searchTerm = signal('');
  selectedRole = signal<string | null>(null);
  dateRange = signal<{ startDate: any; endDate: any } | null>(null);

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
      group: 'Management',
      description: 'Allows viewing tasks'
    },
    {
      key: PermissionKey.TASK_CREATE,
      label: 'Create Tasks',
      group: 'Management',
      description: 'Allows creating new tasks'
    },
    {
      key: PermissionKey.TASK_EDIT,
      label: 'Edit Tasks',
      group: 'Management',
      description: 'Allows editing existing tasks'
    },
    {
      key: PermissionKey.TASK_DELETE,
      label: 'Delete Tasks',
      group: 'Management',
      description: 'Allows deleting tasks'
    },
    {
      key: PermissionKey.MANAGE_USER,
      label: 'Manage Users',
      group: 'Management',
      description: 'Allows managing users and their permissions'
    }
  ];

  selectedPermissions = signal<PermissionKey[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                                 Lifecycle                                  */
  /* -------------------------------------------------------------------------- */

  ngOnInit(): void {
    this.selectedPermissions.set(this.permissions.map(p => p.key));
    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm.set(value ?? '');
    });

    this.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        const currentUser = this.authService.currentUserSignal();

        const filteredUsers = currentUser
          ? users.filter(u => u.id !== currentUser.id)
          : users;

        this.users.set(filteredUsers);
      });
  }

  /* -------------------------------------------------------------------------- */
  /*                             Permissions Logic                               */
  /* -------------------------------------------------------------------------- */

  get allPermissionKeys(): PermissionKey[] {
    return this.permissions.map(p => p.key);
  }

  isAllSelected(): boolean {
    return (
      this.selectedPermissions().length === this.allPermissionKeys.length &&
      this.allPermissionKeys.every(k =>
        this.selectedPermissions().includes(k)
      )
    );
  }

  toggleAll(checked: boolean): void {
    this.selectedPermissions.set(checked
      ? [...this.allPermissionKeys]
      : []);
  }

  clearFilters(): void {
    // Clear search box
    this.searchControl.setValue('');

    // Reset date range (show all dates)
    this.dateRange.set(null);

    // Reset tasks per page to default (5)
    this.selectedPageSize.set(5);
    this.itemsPerPage = 5;

    // Reset pagination to first page
    this.p = 1;
  }

  onSelectionChange(): void {
    this.selectedPermissions.set(this.selectedPermissions().filter(k =>
      this.allPermissionKeys.includes(k)
    ));
  }

  onPermissionsChange(values: PermissionKey[]): void {
    this.selectedPermissions.set(values);
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
    if (this.totalItems == undefined)
      this.itemsPerPage = 0;
    else {
      this.itemsPerPage =
        value === 'All' ? this.totalItems() : value;
    }

    this.p = 1;
    this.isTasksDropdownOpen = false;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Filtering & Sorting                            */
  /* -------------------------------------------------------------------------- */

  filteredTasks = computed<UserModel[]>(() => {
    const users = this.users();
    console.log(users);

    if (!users || users.length === 0) {
      return [];
    }

    const term = this.searchTerm().toLowerCase();
    const range = this.dateRange();
    const selectedPermissions = this.selectedPermissions();

    return users.filter(user => {
      const matchesSearch =
        !term || user.name.toLowerCase().includes(term);

      const matchesPermissions =
        !selectedPermissions.length ||
        selectedPermissions.some(permission =>
          user.permissions?.includes(permission)
        );

      let matchesDate = true;

      if (range?.startDate && range?.endDate) {
        const userDate = dayjs(user.createdAt).format('YYYY-MM-DD');
        const startDate = dayjs(range.startDate).format('YYYY-MM-DD');
        const endDate = dayjs(range.endDate).format('YYYY-MM-DD');

        matchesDate = userDate >= startDate && userDate <= endDate;
      }

      return matchesSearch && matchesPermissions && matchesDate;
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                               Dialog Logic                                  */
  /* -------------------------------------------------------------------------- */

  isDialogClosed: boolean = true;

  resetForm(): void {
    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'INCOMPLETE'
    });

    this.taskForm.enable();
  }
}