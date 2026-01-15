import { Component, ElementRef, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@layouts/header/header';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, NgxDaterangepickerMd, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('task-flow');
  selected: any = { startDate: null, endDate: null };
}
