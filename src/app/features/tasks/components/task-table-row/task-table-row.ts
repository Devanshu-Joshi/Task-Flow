import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  computed,
  effect,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskView } from '@core/models/Task';
import { UserModel } from '@core/models/UserModel';
import { UserAuth } from '@core/services/user-auth/user-auth';
import { PermissionKey } from '@core/models/PermissionKey';

@Component({
  selector: 'tr[app-task-table-row]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-table-row.html',
  styleUrl: './task-table-row.css',
  host: {
    class: 'hover:bg-gray-50 transition'
  }
})
export class TaskTableRow {

  /* -------------------------------------------------------------------------- */
  /*                                   Inputs                                   */
  /* -------------------------------------------------------------------------- */

  @Input({ required: true }) task!: TaskView;

  @Input() dragCellTemplate!: TemplateRef<any>;

  @Input({ required: true })
  set assignedUsers(value: UserModel[]) {
    this.assignedUsersSig.set(value || []);
  }

  private clearTriggerSig = signal<number>(0);

  @Input() set clearExpandedTrigger(v: number) {
    if (v > 0)
      this.clearTriggerSig.set(v);
  }

  constructor(private authService: UserAuth) {
    effect(() => {
      if (this.clearTriggerSig() > 0)  // track changes
        this.expandedSig.set(false);
    });
  }

  statusLabels: Record<string, string> = {
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In Progress',
    INCOMPLETE: 'Incomplete'
  };

  @Input() displayIndex?: number;

  /* -------------------------------------------------------------------------- */
  /*                                  ViewChild                                 */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                                   Signals                                  */
  /* -------------------------------------------------------------------------- */

  assignedUsersSig = signal<UserModel[]>([]);
  expandedSig = signal(false);

  toggleExpanded() {
    this.expandedSig.update(v => !v);
  }

  visibleUsersSig = computed(() => {
    const users = this.assignedUsersSig();

    if (this.expandedSig()) return users;

    return users.slice(0, 2); // 🔥 HARD RULE
  });

  /* Permission signals */
  canEditSig = computed(() =>
    this.authService.currentUserSignal()?.permissions?.includes(PermissionKey.TASK_EDIT) ?? false
  );

  canDeleteSig = computed(() =>
    this.authService.currentUserSignal()?.permissions?.includes(PermissionKey.TASK_DELETE) ?? false
  );

  hiddenCountSig = computed(() =>
    this.assignedUsersSig().length - this.visibleUsersSig().length
  );

  /* -------------------------------------------------------------------------- */
  /*                                   Outputs                                  */
  /* -------------------------------------------------------------------------- */

  @Output() edit = new EventEmitter<TaskView>();
  @Output() delete = new EventEmitter<TaskView>();

  /* -------------------------------------------------------------------------- */
  /*                              Lifecycle Logic                               */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */

  getUsersTooltip(users: UserModel[]): string {
    return users?.map(u => u.name).join(', ') || '';
  }
}