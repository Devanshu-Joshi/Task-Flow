import { Component, EventEmitter, Input, Output, model, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

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
  // Inputs from Parent (Static data)
  statusOptions = input.required<any[]>();
  pageSizeOptions = input.required<readonly (number | string)[]>();

  // The Search Control is passed down so the parent can handle the debounce subscription
  @Input({ required: true }) searchControl!: FormControl;

  // Two-way bindings (Models)
  // When these change here, they automatically update the signal in the parent
  dateRange = model<{ startDate: any; endDate: any } | null>(null);
  selectedStatus = model<string | null>(null);
  selectedPageSize = model<number | 'All'>(5);

  // Outputs (Events)
  @Output() addTask = new EventEmitter<void>();

  // We emit this specifically because the parent needs to reset page 'p' to 1 when size changes
  @Output() pageSizeChangeTrigger = new EventEmitter<number | 'All'>();

  onPageSizeChange(value: number | 'All') {
    this.selectedPageSize.set(value); // Update the model
    this.pageSizeChangeTrigger.emit(value); // Notify parent to run logic (like resetting page index)
  }
}
