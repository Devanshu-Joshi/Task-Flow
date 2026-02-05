import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component, input, effect, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { Task, TaskStatus, TaskView } from '@core/models/Task';
import { TaskDialog } from '@shared/components/task-dialog/task-dialog';
import { TaskForm } from '@shared/components/task-form/task-form';
import { FormBuilder, Validators } from '@angular/forms';
import { UserModel } from '@core/models/UserModel';
import { TaskService } from '@core/services/task/task.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'kanban-view',
  imports: [CommonModule, CdkDrag, DragDropModule, TaskDialog, TaskForm],
  templateUrl: './kanban-view.html',
  styleUrl: './kanban-view.css',
})
export class KanbanView {

  fb = inject(FormBuilder);

  users = input.required<UserModel[]>();

  // Input: The master list of tasks as a Signal
  tasks = input.required<TaskView[]>();
  isDialogClosed: boolean = true;

  // Output: Emit event when a task is moved so parent can update DB/State
  onTaskUpdate = output<{ id: string; status: TaskStatus }>();
  editingTaskId: string | null = null;
  deletingTaskId: string | null = null;
  isEditing = signal(false);
  isDeleting = signal(false);
  dialogTitle = signal('Add');
  dialogDescription = signal('Add task details below');
  dialogTitleColor = signal<'text-primary' | 'text-warn' | 'text-danger'>('text-primary');
  dialogSubmitText = signal('Save');

  // Local mutable arrays for CDK to manipulate
  incompleteList: TaskView[] = [];
  inProgressList: TaskView[] = [];
  completedList: TaskView[] = [];

  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    dueDate: ['', Validators.required],
    status: ['INCOMPLETE' as TaskStatus, Validators.required],
    priority: ['NORMAL', Validators.required],
    assignedTo: [[] as string[]]
  });

  constructor(private taskService: TaskService, private toastr: ToastrService) {
    // Watch for changes in the parent 'tasks' signal and sort them into columns
    effect(() => {
      const currentTasks = this.tasks();

      // Reset arrays
      this.incompleteList = currentTasks.filter(t => t.status === 'INCOMPLETE');
      this.inProgressList = currentTasks.filter(t => t.status === 'IN_PROGRESS');
      this.completedList = currentTasks.filter(t => t.status === 'COMPLETED');
    });
  }

  toggleDialog() {
    this.isDialogClosed = !this.isDialogClosed;
    document.body.classList.toggle('body-lock', !this.isDialogClosed);
    if (this.isDialogClosed) this.resetForm();
  }

  resetForm() {
    this.taskForm.reset({ title: '', dueDate: '', status: 'INCOMPLETE' });
    this.taskForm.enable();
    this.editingTaskId = null;
    this.deletingTaskId = null;
    this.isEditing.set(false);
    this.isDeleting.set(false);
    this.dialogTitle.set('Add');
    this.dialogDescription.set('Add task details below');
    this.dialogTitleColor.set('text-primary');
    this.dialogSubmitText.set('Save');
  }

  drop(event: CdkDragDrop<TaskView[]>) {
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

    const task = event.container.data[event.currentIndex];

    this.onTaskUpdate.emit({
      id: task.id!,
      status: task.status
    });
  }

  async submit() {
    if (this.taskForm.invalid) return;
    const value = this.taskForm.value;

    if (this.editingTaskId) {
      await this.taskService.updateTask(this.editingTaskId, value as Task);
    } else if (this.isDeleting()) {
      await this.taskService.deleteTask(this.deletingTaskId!);
    } else {
      await this.taskService.addTask(value as Task);
    }

    this.toastr.success('Task saved successfully', 'Success');
    this.resetForm();
    this.toggleDialog();
  }

  cancelDialog() {
    this.resetForm();
    this.toggleDialog();
  }

  edit(task: TaskView) {
    this.dialogTitle.set('Edit');
    this.isEditing.set(true);
    this.editingTaskId = task.id!;
    this.taskForm.patchValue(task);
    this.dialogDescription.set('Edit task details below');
    this.dialogTitleColor.set('text-warn');
    this.dialogSubmitText.set('Update');
    this.toggleDialog();
  }

  delete(task: TaskView) {
    this.dialogTitle.set('Delete');
    this.isDeleting.set(true);
    this.deletingTaskId = task.id!;
    this.taskForm.patchValue(task);
    this.taskForm.disable();
    this.dialogDescription.set('Do you really want to delete this task?');
    this.dialogTitleColor.set('text-danger');
    this.dialogSubmitText.set('Delete');
    this.toggleDialog();
  }
}