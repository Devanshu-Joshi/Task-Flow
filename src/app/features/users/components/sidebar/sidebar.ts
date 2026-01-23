import { AfterViewInit, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionItem } from '@core/models/PermissionItem';
import { PermissionKey } from '@core/models/PermissionKey';
import { UserService } from '@core/services/user/user.service';
import { UserModel } from '@core/models/UserModel';
import { ToastrService } from 'ngx-toastr';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { LoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';
import { UserAuth } from '@core/services/user-auth/user-auth';

export type UserSidebarMode = 'add' | 'edit' | 'view' | 'delete';

@Component({
  selector: 'app-sidebar',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, LoadingOverlay],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements AfterViewInit {
  isLoading = signal<boolean>(false);
  isOpen = false;
  mode: UserSidebarMode = 'add';
  selectedUser?: UserModel;

  fb = inject(FormBuilder);
  PermissionKey = PermissionKey;

  permissionList: PermissionItem[] = [
    {
      key: PermissionKey.TASK_VIEW,
      label: 'Task View',
      group: 'Task',
      description: 'Allows viewing tasks',
    },
    {
      key: PermissionKey.TASK_CREATE,
      label: 'Task Create',
      group: 'Task',
      description: 'Allows creating tasks',
    },
    {
      key: PermissionKey.TASK_EDIT,
      label: 'Task Edit',
      group: 'Task',
      description: 'Allows editing tasks',
    },
    {
      key: PermissionKey.TASK_DELETE,
      label: 'Task Delete',
      group: 'Task',
      description: 'Allows deleting tasks',
    },
    {
      key: PermissionKey.MANAGE_USER,
      label: 'Manage Users',
      group: 'User',
      description: 'Allows managing users',
    },
  ];

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],

    password: [{ value: '', disabled: true }],

    permissions: this.fb.array(
      this.permissionList.map(perm =>
        this.fb.control({
          value: perm.key === PermissionKey.TASK_VIEW,
          disabled: false,
        })
      )
    ),
  });

  canManageUsers$: Observable<boolean>;

  constructor(private toastr: ToastrService, private userAuth: UserAuth, private userService: UserService) {
    this.canManageUsers$ = this.userAuth.currentUser$.pipe(
      map(user => user?.permissions?.includes(PermissionKey.MANAGE_USER) ?? false)
    );
  }

  private destroy$ = new Subject<void>();

  ngAfterViewInit() {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    permissionsArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const taskViewIndex = this.permissionList.findIndex(
          p => p.key === PermissionKey.TASK_VIEW
        );

        if (taskViewIndex !== -1) {
          permissionsArray.at(taskViewIndex).setValue(true, { emitEvent: false });
        }
      });

    this.userAuth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        const canManage = user?.permissions?.includes(PermissionKey.MANAGE_USER);

        // If permission revoked while sidebar is open (any mode)
        if (!canManage && this.isOpen) {
          this.closeSidebar();
          if (this.mode !== 'view') {
            this.toastr.warning(
              'Your permissions have changed',
              'Access Updated'
            );
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get permissionsArray(): FormArray {
    return this.userForm.get('permissions') as FormArray;
  }

  private updatePermissionControls(): void {
    const permissionsArray = this.permissionsArray;

    permissionsArray.controls.forEach((control, index) => {
      const perm = this.permissionList[index];

      if (perm.key === PermissionKey.TASK_VIEW) {
        control.setValue(true, { emitEvent: false });
        control.disable({ emitEvent: false });
        return;
      }

      if (this.mode === 'view' || this.mode === 'delete') {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }

  openSidebar() {
    this.isOpen = true;
  }

  openAdd() {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.mode = 'add';
    this.userForm.reset();
    this.userForm.enable();

    this.updateFieldAccessByMode();

    const password = this.userForm.get('password');
    password?.setValidators([
      Validators.required,
      Validators.minLength(6),
    ]);
    password?.enable();
    password?.updateValueAndValidity();

    this.updatePermissionControls();
    this.isOpen = true;
  }

  openEdit(user: UserModel) {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.mode = 'edit';
    this.userForm.enable();

    this.disablePassword();
    this.patchUserToForm(user);
    this.updateFieldAccessByMode();
    this.updatePermissionControls();

    this.selectedUser = user;
    this.isOpen = true;
  }

  openView(user: UserModel) {
    this.mode = 'view';

    this.disablePassword();
    this.patchUserToForm(user);

    this.userForm.disable({ emitEvent: false });
    this.updateFieldAccessByMode();
    this.updatePermissionControls();

    this.userForm.markAsPristine();

    this.isOpen = true;
  }

  openDelete(user: UserModel) {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.mode = 'delete';

    this.disablePassword();
    this.patchUserToForm(user);

    this.userForm.disable({ emitEvent: false });
    this.updateFieldAccessByMode();
    this.updatePermissionControls();

    this.selectedUser = user;
    this.isOpen = true;
  }

  private updateFieldAccessByMode(): void {
    const name = this.userForm.get('name');
    const email = this.userForm.get('email');

    if (this.mode === 'edit' || this.mode === 'view' || this.mode === 'delete') {
      name?.disable({ emitEvent: false });
      email?.disable({ emitEvent: false });
    } else {
      name?.enable({ emitEvent: false });
      email?.enable({ emitEvent: false });
    }
  }

  private disablePassword(): void {
    const password = this.userForm.get('password');
    password?.clearValidators();
    password?.setValue('');
    password?.disable();
    password?.updateValueAndValidity();
  }

  private mapUserPermissionsToForm(userPermissions: PermissionKey[]): boolean[] {
    return this.permissionList.map(p =>
      userPermissions.includes(p.key)
    );
  }

  private patchUserToForm(user: UserModel) {
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      permissions: this.mapUserPermissionsToForm(user.permissions),
    });

    const taskViewIndex = this.permissionList.findIndex(
      p => p.key === PermissionKey.TASK_VIEW
    );

    if (taskViewIndex !== -1) {
      this.permissionsArray.at(taskViewIndex).setValue(true, { emitEvent: false });
    }
  }

  closeSidebar() {
    this.isOpen = false;
    this.userForm.reset();
    this.permissionsArray.controls.forEach(c => c.setValue(false));
    this.selectedUser = undefined;
  }

  private getSelectedPermissions(): PermissionKey[] {
    const values = this.permissionsArray.getRawValue();

    return this.permissionList
      .filter((_, i) => values[i])
      .map(p => p.key);
  }

  addUser() {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.isLoading.set(true);
    const selectedPermissions = this.getSelectedPermissions();

    const formValue = this.userForm.value;

    const payload: Partial<UserModel> = {
      name: formValue.name ?? undefined,
      email: formValue.email ?? undefined,
      password: formValue.password ?? undefined,
      permissions: selectedPermissions,
    };

    this.userService.addUser(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success('User added successfully', 'Action Completed');
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });

    this.closeSidebar();
  }

  updateUser() {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.isLoading.set(true);
    if (!this.selectedUser?.id || this.userForm.pristine) return;

    const selectedPermissions = this.getSelectedPermissions();

    const formValue = this.userForm.value;

    const payload: Partial<UserModel> & { id: string } = {
      id: this.selectedUser.id,
      permissions: selectedPermissions,
    };

    if (this.userForm.get('password')?.enabled) {
      payload.password = formValue.password ?? undefined;
    }

    this.userService.updateUser(payload).subscribe({
      next: (updatedUser) => {
        this.isLoading.set(false);
        if (updatedUser.id === this.userAuth.currentUser?.id) {
          this.userAuth.setCurrentUser(updatedUser);
        }
        this.toastr.success('User Updated Successfully', 'Action Performed');
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });

    this.closeSidebar();
  }

  deleteUser(id: string) {
    if (!this.canManageUsers) {
      this.showNoPermission();
      return;
    }
    this.isLoading.set(true);
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success("User Deleted Successfully", "Action Confirmed")
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err)
        this.toastr.error("User Not Deleted Successfully", "Action Can't be Confirmed")
      }
    })

    this.closeSidebar()
  }

  get allPermissionsEnabled(): boolean {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    return permissionsArray.controls.every((control, index) => {
      const perm = this.permissionList[index];
      return perm.key === PermissionKey.TASK_VIEW || control.value === true;
    });
  }

  get canManageUsers(): boolean {
    return this.userAuth.hasPermission(PermissionKey.MANAGE_USER);
  }

  toggleAllPermissions(): void {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    const enable = !this.allPermissionsEnabled;

    permissionsArray.controls.forEach((control, index) => {
      const perm = this.permissionList[index];

      if (perm.key === PermissionKey.TASK_VIEW) {
        control.setValue(true);
        return;
      }

      control.setValue(enable);
    });
  }

  private showNoPermission(): void {
    console.log(this.userAuth.currentUser);
    this.toastr.error(
      'You have no permission for this task',
      'Access Denied'
    );
  }

}
