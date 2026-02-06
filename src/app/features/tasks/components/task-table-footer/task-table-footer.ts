import { Component, EventEmitter, input, Input, model, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-table-footer',
  imports: [CommonModule, NgSelectModule, FormsModule],
  templateUrl: './task-table-footer.html',
  styleUrl: './task-table-footer.css',
})
export class TaskTableFooter {
  @Input() total: number = 0;
  @Input() itemsPerPage: number = 5;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  selectedPageSize = model<number | 'All'>(5);

  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

  pageSizeOptions = input.required<readonly (number | string)[]>();

  onPageSizeChange(value: number | 'All') {
    this.selectedPageSize.set(value); // Update the model
    this.pageSizeChangeTrigger.emit(value); // Notify parent to run logic (like resetting page index)
  }

  @Output() pageSizeChangeTrigger = new EventEmitter<number | 'All'>();

}
