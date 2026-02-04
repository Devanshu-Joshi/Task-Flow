import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component, input, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '@core/models/Task';

@Component({
  selector: 'kanban-view',
  imports: [CommonModule, CdkDrag, DragDropModule],
  templateUrl: './kanban-view.html',
  styleUrl: './kanban-view.css',
})
export class KanbanView {
  // Input: The master list of tasks as a Signal
  tasks = input.required<Task[]>();

  // Output: Emit event when a task is moved so parent can update DB/State
  onTaskUpdate = output<Task[]>();

  // Local mutable arrays for CDK to manipulate
  incompleteList: Task[] = [];
  inProgressList: Task[] = [];
  completedList: Task[] = [];

  constructor() {
    // Watch for changes in the parent 'tasks' signal and sort them into columns
    effect(() => {
      const currentTasks = this.tasks();

      // Reset arrays
      this.incompleteList = currentTasks.filter(t => t.status === 'INCOMPLETE');
      this.inProgressList = currentTasks.filter(t => t.status === 'IN_PROGRESS');
      this.completedList = currentTasks.filter(t => t.status === 'COMPLETED');
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Moving between columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // 1. Get the task that was moved
      const task = event.container.data[event.currentIndex];

      // 2. Update its status based on the container ID (or logic)
      // We assume the container ID matches the status or we map it manually
      const containerId = event.container.id;

      if (containerId === 'incompleteList') task.status = 'INCOMPLETE';
      if (containerId === 'inProgressList') task.status = 'IN_PROGRESS';
      if (containerId === 'completedList') task.status = 'COMPLETED';
    }

    // Optional: Emit the combined list back to parent if needed
    const allTasks = [
      ...this.incompleteList,
      ...this.inProgressList,
      ...this.completedList
    ];
    this.onTaskUpdate.emit(allTasks);
  }
}