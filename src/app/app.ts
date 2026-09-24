import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavbarComponent } from './layout/top-navbar/top-navbar.component';

@Component({
  imports: [RouterOutlet, TopNavbarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
}
