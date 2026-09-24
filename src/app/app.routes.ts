import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { SalesReportComponent } from './features/sales-report/sales-report.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'relatorio-vendas', component: SalesReportComponent },
  // The Filiais screen is introduced in Sprint 6; keep its destination defined without inventing it here.
  { path: 'filiais', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
