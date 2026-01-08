import { Injectable, signal } from '@angular/core';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, getFirestore } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

export interface Task {
  id?: string;
  title: string;
  status: string;
  dueDate: string;
  createdAt: number;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {

  constructor(private auth: Auth, private firestore: Firestore) {
    this.loadTasks();
  }

  tasks = signal<Task[]>([]);

  private unsubscribeSnapshot?: () => void;

  loadTasks() {
    onAuthStateChanged(this.auth, (user) => {

      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = undefined;
      }

      if (!user) {
        console.log('User not authenticated, clearing tasks');
        this.tasks.set([]);
        return;
      }

      console.log('Authenticated user:', user.uid);

      const q = query(
        collection(this.firestore, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          console.log('Snapshot received');
          console.log('From cache:', snapshot.metadata.fromCache);
          console.log('Documents count:', snapshot.size);

          const tasks = snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              ...data,
            } as Task;
          });

          console.log('Loaded tasks:', tasks);

          this.tasks.set(tasks);
        },
        (error) => {
          console.error('Firestore snapshot error:', error);
        }
      );
    });
  }

  async addTask(task: {
    title: string;
    dueDate: string;
    status: 'Incomplete' | 'Completed' | 'InProgress';
  }) {
    const user = await this.auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const newTask: Task = {
      title: task.title.trim(),
      dueDate: task.dueDate,
      status: task.status,
      createdAt: Date.now(),
      userId: user.uid
    };

    console.log('UID:', user.uid);

    await addDoc(collection(this.firestore, 'tasks'), newTask);
  }

}
