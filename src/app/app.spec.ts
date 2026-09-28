import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { TutorialService } from './core/tutorial/tutorial.service';
import { WHATSAPP_CONTACT_URL } from './core/whatsapp-contact';

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

  it('places the WhatsApp link between MeuValida and Iniciar tutorial and opens a new tab', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const items = [...(fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('.primary-navigation > .navigation-item')];
    const whatsappIndex = items.findIndex((item) => item.textContent?.trim() === 'WhatsApp');
    const link = items[whatsappIndex] as HTMLAnchorElement;
    expect(whatsappIndex).toBeGreaterThan(0);
    expect(items[whatsappIndex - 1].textContent).toContain('MeuValida');
    expect(items[whatsappIndex + 1].textContent).toContain('Iniciar tutorial');
    expect(link.href).toBe(WHATSAPP_CONTACT_URL);
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('shows a short contact action after ending the tutorial and allows dismissal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const tutorial = TestBed.inject(TutorialService);
    tutorial.startHome();
    tutorial.finish();
    fixture.detectChanges();

    const rendered = fixture.nativeElement as HTMLElement;
    const dialog = rendered.querySelector<HTMLElement>('.tutorial-contact-dialog');
    const link = dialog?.querySelector<HTMLAnchorElement>('a');
    expect(dialog?.textContent).toContain('Gostou da prévia');
    expect(dialog?.textContent).not.toContain(WHATSAPP_CONTACT_URL);
    expect(link?.textContent).toContain('Chamar no WhatsApp');
    expect(link?.href).toBe(WHATSAPP_CONTACT_URL);
    expect(link?.target).toBe('_blank');

    dialog?.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    expect(rendered.querySelector('.tutorial-contact-dialog')).toBeNull();
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

  it('opens Filiais from the navbar and keeps the shared shell visible', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const rendered = fixture.nativeElement as HTMLElement;
    const link = rendered.querySelector<HTMLAnchorElement>(
      'a[routerLink="/filiais"]',
    );
    expect(link).toBeTruthy();
    link!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/filiais');
    expect(fixture.nativeElement.querySelector('app-branches')).toBeTruthy();
    expect((fixture.nativeElement.querySelector('app-top-navbar') as HTMLElement).hidden).toBe(false);
  });

  it('returns to Início from Filiais through the navbar', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/filiais');
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLAnchorElement>('a.navigation-item[routerLink="/"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('app-home')).toBeTruthy();
  });

  it('opens Nova Conciliação through the submenu without linking the parent item', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const rendered = fixture.nativeElement as HTMLElement;
    const menuButton = rendered.querySelector<HTMLButtonElement>('.navigation-dropdown button');
    const submenuLink = rendered.querySelector<HTMLAnchorElement>(
      '.navigation-submenu a[routerLink="/nova-conciliacao"]',
    );
    expect(menuButton).toBeTruthy();
    expect(menuButton?.hasAttribute('routerLink')).toBe(false);
    expect(submenuLink?.textContent?.trim()).toBe('Nova Conciliação');

    submenuLink!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/nova-conciliacao');
    expect(rendered.querySelector('app-manual-reconciliation .introduction')).toBeTruthy();
    expect(rendered.querySelector('app-manual-reconciliation .bank-selection')).toBeNull();
    expect((rendered.querySelector('app-top-navbar') as HTMLElement).hidden).toBe(false);
  });
});
