import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SalesReportComponent } from './features/sales-report/sales-report.component';
import { TopNavbarComponent } from './layout/top-navbar/top-navbar.component';

@Component({
  imports: [RouterOutlet, TopNavbarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected navbarVisible = true;

  protected routeActivated(component: unknown): void {
    this.navbarVisible = !(component instanceof SalesReportComponent);
  }
}
