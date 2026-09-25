import { afterNextRender, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { TutorialService } from '../../core/tutorial/tutorial.service';

interface FocusRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.component.html',
  styleUrl: './tutorial-overlay.component.css',
})
export class TutorialOverlayComponent {
  protected readonly tutorial = inject(TutorialService);
  protected readonly focusRects = signal<readonly FocusRect[]>([]);
  protected readonly hole = signal<FocusRect>({ left: 0, top: 0, width: 0, height: 0 });
  protected readonly bubble = signal({ left: 12, top: 70 });
  protected readonly viewport = signal({ width: 0, height: 0 });

  private readonly destroyRef = inject(DestroyRef);
  private readonly observer = new MutationObserver(() => this.scheduleMeasurement());
  private frame = 0;
  private optionalTimer: ReturnType<typeof setTimeout> | null = null;
  private scrolledStep: string | null = null;

  constructor() {
    effect(() => {
      const id = this.tutorial.step()?.id ?? null;
      if (id !== this.scrolledStep) this.scrolledStep = null;
      this.scheduleMeasurement();
    });

    afterNextRender(() => {
      window.addEventListener('resize', this.scheduleMeasurement);
      window.addEventListener('focus', this.scheduleMeasurement);
      window.addEventListener('scroll', this.scheduleMeasurement, true);
      document.addEventListener('visibilitychange', this.scheduleMeasurement);
      document.addEventListener('click', this.onAction);
      document.addEventListener('change', this.onAction);
      this.observer.observe(document.body, { childList: true, subtree: true });
      this.scheduleMeasurement();
    });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', this.scheduleMeasurement);
      window.removeEventListener('focus', this.scheduleMeasurement);
      window.removeEventListener('scroll', this.scheduleMeasurement, true);
      document.removeEventListener('visibilitychange', this.scheduleMeasurement);
      document.removeEventListener('click', this.onAction);
      document.removeEventListener('change', this.onAction);
      this.observer.disconnect();
      cancelAnimationFrame(this.frame);
      if (this.optionalTimer) clearTimeout(this.optionalTimer);
    });
  }

  protected next(): void {
    this.tutorial.next();
  }

  protected stop(): void {
    this.tutorial.stop();
  }

  private readonly onAction = (event: Event): void => {
    const origin = event.target;
    if (!(origin instanceof Element)) return;
    const control = origin.closest<HTMLElement>('[data-tour-action]');
    if (!control) return;
    if (event.type === 'click' && control.matches('input, select')) return;
    if (event.type === 'change' && !control.matches('input, select')) return;
    const value = control instanceof HTMLInputElement || control instanceof HTMLSelectElement
      ? control.value : undefined;
    this.tutorial.observe(control.dataset['tourAction'] ?? '', value);
  };

  private readonly scheduleMeasurement = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measure());
  };

  private measure(): void {
    const step = this.tutorial.step();
    if (!step) {
      this.focusRects.set([]);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.viewport.set({ width, height });
    const elements = step.targets.flatMap((name) =>
      [...document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)],
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (!elements.length) {
      this.focusRects.set([]);
      this.hole.set({ left: 0, top: 0, width: 0, height: 0 });
      this.bubble.set({ left: Math.max(12, (width - 350) / 2), top: Math.max(70, (height - 140) / 2) });
      if (step.optionalWhenMissing && !this.optionalTimer &&
          (step.route === '*' || window.location.pathname === step.route)) {
        this.optionalTimer = setTimeout(() => {
          this.optionalTimer = null;
          this.tutorial.skipMissingTarget(step.id);
        }, 450);
      }
      return;
    }

    if (this.optionalTimer) {
      clearTimeout(this.optionalTimer);
      this.optionalTimer = null;
    }

    const first = elements[0];
    const firstRect = first.getBoundingClientRect();
    if (this.scrolledStep !== step.id &&
        (firstRect.top < 8 || firstRect.bottom > height - 8)) {
      this.scrolledStep = step.id;
      first.scrollIntoView({ block: 'center', behavior: 'auto' });
      this.scheduleMeasurement();
      return;
    }
    this.scrolledStep = step.id;

    const rects = elements.map((element): FocusRect => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.max(0, rect.left - 5),
        top: Math.max(0, rect.top - 5),
        width: Math.min(width, rect.right + 5) - Math.max(0, rect.left - 5),
        height: Math.min(height, rect.bottom + 5) - Math.max(0, rect.top - 5),
      };
    });
    this.focusRects.set(rects);
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.min(width, Math.max(...rects.map((rect) => rect.left + rect.width)) + (step.extraRight ?? 0));
    const bottom = Math.min(height, Math.max(...rects.map((rect) => rect.top + rect.height)) + (step.extraBottom ?? 0));
    const hole = { left, top, width: right - left, height: bottom - top };
    this.hole.set(hole);
    this.positionBubble(hole, width, height);
  }

  private positionBubble(hole: FocusRect, viewportWidth: number, viewportHeight: number): void {
    const bubbleWidth = Math.min(350, viewportWidth - 24);
    const bubbleHeight = document.querySelector<HTMLElement>('.tutorial-bubble')?.offsetHeight ?? 150;
    const clamp = (value: number, minimum: number, maximum: number) =>
      Math.max(minimum, Math.min(value, maximum));
    const x = clamp(hole.left, 12, viewportWidth - bubbleWidth - 12);
    const below = hole.top + hole.height + 12;
    const above = hole.top - bubbleHeight - 12;
    const right = hole.left + hole.width + 12;
    const left = hole.left - bubbleWidth - 12;

    if (below + bubbleHeight <= viewportHeight - 12) {
      this.bubble.set({ left: x, top: below });
    } else if (above >= 12) {
      this.bubble.set({ left: x, top: above });
    } else if (right + bubbleWidth <= viewportWidth - 12) {
      this.bubble.set({ left: right, top: clamp(hole.top, 60, viewportHeight - bubbleHeight - 12) });
    } else if (left >= 12) {
      this.bubble.set({ left, top: clamp(hole.top, 60, viewportHeight - bubbleHeight - 12) });
    } else {
      this.bubble.set({ left: viewportWidth - bubbleWidth - 12, top: clamp(viewportHeight - bubbleHeight - 12, 60, viewportHeight) });
    }
  }
}
