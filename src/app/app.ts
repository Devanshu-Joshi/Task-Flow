import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layouts/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('task-flow');
}
