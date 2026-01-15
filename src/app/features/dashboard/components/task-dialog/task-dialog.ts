import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.css',
})
export class TaskDialog {
  @Input() open: boolean = false;
  @Output() close = new EventEmitter<void>();
}
