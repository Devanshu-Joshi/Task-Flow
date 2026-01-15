import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'tr[app-task-table-footer]',
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './task-table-footer.html',
  styleUrl: './task-table-footer.css',
})
export class TaskTableFooter {
  @Input() total: number = 0;
  @Input() itemsPerPage: number = 5;
  @Input() colspan: number = 5;

  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
}
