import { Component, EventEmitter, Input, Output, model, input, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
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
  pageSizeOptions = input.required<readonly (number | string)[]>();
  assignedUserOptions = input.required<UserModel[]>();

  // The Search Control is passed down so the parent can handle the debounce subscription
  @Input({ required: true }) searchControl!: FormControl;

  // Two-way bindings (Models)
  // When these change here, they automatically update the signal in the parent
  dateRange = model<{ startDate: any; endDate: any } | null>(null);
  selectedStatus = model<string | null>(null);
  selectedPageSize = model<number | 'All'>(5);
  selectedAssignedUser = model<string | null>(null);
  isUISwitched = signal<boolean>(false);

  // Outputs (Events)
  @Output() addTask = new EventEmitter<void>();

  // We emit this specifically because the parent needs to reset page 'p' to 1 when size changes
  @Output() pageSizeChangeTrigger = new EventEmitter<number | 'All'>();

  @Output() UISwitchedTrigger = new EventEmitter<boolean>();

  onPageSizeChange(value: number | 'All') {
    this.selectedPageSize.set(value); // Update the model
    this.pageSizeChangeTrigger.emit(value); // Notify parent to run logic (like resetting page index)
  }

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
