import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { FeesReportComponent } from './features/fees-report/fees-report.component';
import { MonthlyReportComponent } from './features/monthly-report/monthly-report.component';
import { SalesReportComponent } from './features/sales-report/sales-report.component';
import { BranchesComponent } from './features/branches/branches.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'relatorio-vendas', component: SalesReportComponent },
  { path: 'relatorio-taxas', component: FeesReportComponent },
  { path: 'resultado-mensal', component: MonthlyReportComponent },
  { path: 'filiais', component: BranchesComponent },
  { path: '**', redirectTo: '' },
];
