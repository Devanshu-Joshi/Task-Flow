export type TaskStatus = 'INCOMPLETE' | 'COMPLETED' | 'IN_PROGRESS';
export type TaskPriority = 'HIGH' | 'NORMAL' | 'LOW';

export interface Task {
    id?: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    createdAt: number;
    userId: string;
    assignedTo: string[];
}

export interface TaskView extends Task {
    displayId: number;
}