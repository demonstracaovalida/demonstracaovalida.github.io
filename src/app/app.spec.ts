import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the legacy navigation shell and omits removed menu items', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-top-navbar')).toBeTruthy();
    expect(compiled.textContent).toContain('Início');
    expect(compiled.textContent).toContain('Conciliação');
    expect(compiled.textContent).toContain('Filiais');
    expect(compiled.textContent).not.toContain('Cadastros');
    expect(compiled.textContent).not.toContain('Manutenção');
    expect(compiled.textContent).not.toContain('Sair');
  });

  it('hides the shared navbar while the sales report is active', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    await TestBed.inject(Router).navigateByUrl(
      '/relatorio-vendas?startDate=2026-08-01&endDate=2026-08-01',
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sales-report')).toBeTruthy();
    expect((compiled.querySelector('app-top-navbar') as HTMLElement).hidden).toBe(true);
  });

  it('hides the shared navbar while the fees report is active', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    await TestBed.inject(Router).navigateByUrl(
      '/relatorio-taxas?startDate=2026-08-01&endDate=2026-08-31',
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-fees-report')).toBeTruthy();
    expect((compiled.querySelector('app-top-navbar') as HTMLElement).hidden).toBe(true);
  });

  it('hides the shared navbar while the monthly report is active', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    await TestBed.inject(Router).navigateByUrl(
      '/resultado-mensal?startDate=2026-08-01&endDate=2026-08-31',
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-monthly-report')).toBeTruthy();
    expect((compiled.querySelector('app-top-navbar') as HTMLElement).hidden).toBe(true);
  });
});
