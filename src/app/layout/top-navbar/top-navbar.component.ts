import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TutorialService } from '../../core/tutorial/tutorial.service';
import { WHATSAPP_CONTACT_URL } from '../../core/whatsapp-contact';

@Component({
  selector: 'app-top-navbar',
  imports: [RouterLink],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css',
})
export class TopNavbarComponent {
  protected readonly whatsappUrl = WHATSAPP_CONTACT_URL;
  private readonly router = inject(Router);
  private readonly tutorial = inject(TutorialService);
  protected readonly currentRoute = signal(this.router.url.split('?')[0]);
  protected readonly showTutorialButton = computed(() =>
    this.currentRoute() === '/' || this.currentRoute() === '/nova-conciliacao',
  );

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe((event) => this.currentRoute.set(event.urlAfterRedirects.split('?')[0]));
  }

  protected startTutorial(): void {
    if (this.currentRoute() === '/') this.tutorial.startHome();
    if (this.currentRoute() === '/nova-conciliacao') this.tutorial.startManual();
  }
}
