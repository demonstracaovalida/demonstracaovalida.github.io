import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TutorialService } from '../../core/tutorial/tutorial.service';
import { WHATSAPP_CONTACT_URL } from '../../core/whatsapp-contact';

@Component({
  selector: 'app-top-navbar',
  imports: [RouterLink],
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.css', './top-navbar-mobile.css'],
})
export class TopNavbarComponent {
  protected readonly whatsappUrl = WHATSAPP_CONTACT_URL;
  private readonly router = inject(Router);
  private readonly tutorial = inject(TutorialService);
  protected readonly currentRoute = signal(this.router.url.split('?')[0]);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly mobileConciliationOpen = signal(false);
  protected readonly showTutorialButton = computed(() =>
    this.currentRoute() === '/' || this.currentRoute() === '/nova-conciliacao',
  );

  constructor() {
    effect(() => {
      const step = this.tutorial.step()?.id;
      if (typeof window === 'undefined' || !window.matchMedia?.('(max-width: 820px)').matches) return;
      if (step === 'branches-navigation' || step === 'manual-navigation') {
        this.mobileMenuOpen.set(true);
        this.mobileConciliationOpen.set(step === 'manual-navigation');
      }
    });

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe((event) => {
      this.currentRoute.set(event.urlAfterRedirects.split('?')[0]);
      this.closeMobileMenu();
    });
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
    if (!this.mobileMenuOpen()) this.mobileConciliationOpen.set(false);
  }

  protected toggleConciliation(): void {
    this.mobileConciliationOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.mobileConciliationOpen.set(false);
  }

  protected startTutorial(): void {
    if (this.currentRoute() === '/') this.tutorial.startHome();
    if (this.currentRoute() === '/nova-conciliacao') this.tutorial.startManual();
  }
}
