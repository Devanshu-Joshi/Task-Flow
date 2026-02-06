import { Component, EventEmitter, Input, Output, model, input, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { UserModel } from '@core/models/UserModel';
import { UserAuth } from '@core/services/user-auth/user-auth';
import { PermissionKey } from '@core/models/PermissionKey';

@Component({
  selector: 'app-task-filters',
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    NgxDaterangepickerMd],
  templateUrl: './task-filters.html',
  styleUrl: './task-filters.css',
})
export class TaskFilters {

  constructor(private authService: UserAuth) {
    effect(() => {
      this.UISwitchedTrigger.emit(this.isUISwitched());
    })
  }

  // Inputs from Parent (Static data)
  statusOptions = input.required<any[]>();
  assignedUserOptions = input.required<UserModel[]>();

  // The Search Control is passed down so the parent can handle the debounce subscription
  @Input({ required: true }) searchControl!: FormControl;

  // Two-way bindings (Models)
  // When these change here, they automatically update the signal in the parent
  dateRange = model<{ startDate: any; endDate: any } | null>(null);
  selectedStatus = model<string | null>(null);
  selectedAssignedUser = model<string | null>(null);
  isUISwitched = signal<boolean>(false);

  // Outputs (Events)
  @Output() addTask = new EventEmitter<void>();

  @Output() UISwitchedTrigger = new EventEmitter<boolean>();

  toggleDatePicker() {
    const picker = document.querySelector(
      '.md-drppicker'
    ) as HTMLElement;
    if (picker.classList.contains("shown")) {
      picker.classList.remove("shown");
      picker.classList.add("hidden");
    }
    else {
      picker.classList.remove("hidden");
      picker.classList.add("shown");
    }
  }

  /* Permission signals */
  canCreateTaskSig = computed(() =>
    this.authService.currentUserSignal()?.permissions?.includes(PermissionKey.TASK_CREATE) ?? false
  );
}
