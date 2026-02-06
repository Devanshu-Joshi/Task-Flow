import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-task-table-footer',
  imports: [CommonModule, NgSelectComponent],
  templateUrl: './task-table-footer.html',
  styleUrl: './task-table-footer.css',
})
export class TaskTableFooter {
  @Input() total: number = 0;
  @Input() itemsPerPage: number = 5;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

}
