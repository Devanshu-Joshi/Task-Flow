import { AfterViewInit, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionItem } from '@core/models/PermissionItem';
import { PermissionKey } from '@core/models/PermissionKey';
import { UserService } from '@core/services/user';
import { UserModel } from '@core/models/User';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sidebar',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements AfterViewInit {
  isOpen = false;

  fb = inject(FormBuilder);
  PermissionKey = PermissionKey;

  @Output() userAdded = new EventEmitter<void>();

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
    password: ['', [Validators.required, Validators.minLength(6)]],
    permissions: this.fb.array(this.permissionList.map((perm => this.fb.control(perm.key === PermissionKey.TASK_VIEW, [])))),
  });

  constructor(private userService: UserService, private toastr: ToastrService) { }

  ngAfterViewInit() {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    permissionsArray.valueChanges.subscribe(() => {
      const taskViewIndex = this.permissionList.findIndex(
        p => p.key === PermissionKey.TASK_VIEW
      );

      if (taskViewIndex !== -1) {
        permissionsArray.at(taskViewIndex).setValue(true, { emitEvent: false });
      }
    });
  }

  get permissionsArray(): FormArray {
    return this.userForm.get('permissions') as FormArray;
  }

  openSidebar() {
    this.isOpen = true;
  }

  closeSidebar() {
    this.isOpen = false;
    this.userForm.reset();
    this.permissionsArray.controls.forEach(c => c.setValue(false));
  }

  addUser() {
    const selectedPermissions = this.permissionList
      .filter((_, i) => this.permissionsArray.value[i])
      .map(p => p.key);

    const payload = {
      ...this.userForm.value,
      permissions: selectedPermissions,
    };

    this.userService.addUser(payload as UserModel).subscribe({
      next: (result) => {
        console.log("Get User = " + result);
        this.toastr.success("User added successfully", "Action Completed");
      },
      error: (err) => {
        console.error(err);
      }
    })

    this.userAdded.emit();
    this.closeSidebar();
  }

  get allPermissionsEnabled(): boolean {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    return permissionsArray.controls.every((control, index) => {
      const perm = this.permissionList[index];
      return perm.key === PermissionKey.TASK_VIEW || control.value === true;
    });
  }

  toggleAllPermissions(): void {
    const permissionsArray = this.userForm.get('permissions') as FormArray;

    const enable = !this.allPermissionsEnabled;

    permissionsArray.controls.forEach((control, index) => {
      const perm = this.permissionList[index];

      if (perm.key === PermissionKey.TASK_VIEW) {
        control.setValue(true); // 🔒 force ON
        return;
      }

      control.setValue(enable);
    });
  }

}
