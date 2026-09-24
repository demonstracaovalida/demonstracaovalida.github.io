import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeesReportComponent } from './features/fees-report/fees-report.component';
import { MonthlyReportComponent } from './features/monthly-report/monthly-report.component';
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
    this.navbarVisible = !(
      component instanceof SalesReportComponent ||
      component instanceof FeesReportComponent ||
      component instanceof MonthlyReportComponent
    );
  }
}
