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
  effect
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
export class TaskTableRow implements AfterViewInit {

  /* -------------------------------------------------------------------------- */
  /*                                   Inputs                                   */
  /* -------------------------------------------------------------------------- */

  @Input({ required: true }) task!: TaskView;

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

  @Input() displayIndex?: number;

  /* -------------------------------------------------------------------------- */
  /*                                  ViewChild                                 */
  /* -------------------------------------------------------------------------- */

  @ViewChild('assigneeContainer') container!: ElementRef<HTMLDivElement>;

  /* -------------------------------------------------------------------------- */
  /*                                   Signals                                  */
  /* -------------------------------------------------------------------------- */

  assignedUsersSig = signal<UserModel[]>([]);
  private containerWidthSig = signal<number>(0);

  /* Smart width rules */
  private readonly IDEAL_CHIP_WIDTH = 90;
  private readonly MIN_CHIP_WIDTH = 65;
  private readonly MORE_CHIP_WIDTH = 60;
  expandedSig = signal(false);

  toggleExpanded() {
    this.expandedSig.update(v => !v);
  }

  visibleUsersSig = computed(() => {
    const users = this.assignedUsersSig();
    const totalWidth = this.containerWidthSig();

    if (this.expandedSig()) return users;
    if (!totalWidth || !users.length) return [];

    let usedWidth = 0;
    const visible: UserModel[] = [];

    for (let i = 0; i < users.length; i++) {
      const remainingUsers = users.length - (i + 1);
      const needMoreChip = remainingUsers > 0;

      const spaceLeft = totalWidth - usedWidth;
      const reservedForMore = needMoreChip ? this.MORE_CHIP_WIDTH : 0;
      const available = spaceLeft - reservedForMore;

      if (available >= this.IDEAL_CHIP_WIDTH) {
        visible.push(users[i]);
        usedWidth += this.IDEAL_CHIP_WIDTH;
      } else if (available >= this.MIN_CHIP_WIDTH) {
        visible.push(users[i]);
        usedWidth += this.MIN_CHIP_WIDTH;
      } else {
        break;
      }
    }

    return visible;
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

  ngAfterViewInit() {
    setTimeout(() => this.updateWidth());

    window.addEventListener('resize', () => this.updateWidth());
  }

  private updateWidth() {
    if (!this.container) return;
    const width = this.container.nativeElement.offsetWidth;
    if (width > 0) {
      this.containerWidthSig.set(width);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */

  getUsersTooltip(users: UserModel[]): string {
    return users?.map(u => u.name).join(', ') || '';
  }
}