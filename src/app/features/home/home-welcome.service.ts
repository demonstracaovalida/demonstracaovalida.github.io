import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HomeWelcomeService {
  readonly visible = signal(true);
  readonly tutorialChoiceVisible = signal(false);

  dismiss(): void {
    this.visible.set(false);
    this.tutorialChoiceVisible.set(true);
  }

  closeTutorialChoice(): void {
    this.tutorialChoiceVisible.set(false);
  }
}
