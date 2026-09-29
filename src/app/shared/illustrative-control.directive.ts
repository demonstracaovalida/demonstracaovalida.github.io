import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, Renderer2, inject } from '@angular/core';

/** Marks controls whose real functionality is outside the preview. */
@Directive({
  selector: '[appIllustrative]',
  host: {
    class: 'illustrative-control',
    role: 'button',
    tabindex: '0',
    'aria-disabled': 'true',
    'aria-description': 'Indisponível nesta prévia',
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hideUnlessFocused()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(click)': 'explain($event)',
    '(keydown.enter)': 'explain($event)',
    '(keydown.space)': 'explain($event)',
    '(keydown.escape)': 'hide()',
  },
})
export class IllustrativeControlDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private tooltip: HTMLElement | null = null;
  private cleanups: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  protected explain(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.show();
  }

  protected show(): void {
    if (this.tooltip) return;
    const tooltip: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(tooltip, 'illustrative-tooltip');
    this.renderer.setAttribute(tooltip, 'role', 'tooltip');
    this.renderer.appendChild(tooltip, this.renderer.createText('Indisponível nesta prévia'));
    this.renderer.appendChild(this.document.body, tooltip);
    this.tooltip = tooltip;

    const rect = this.element.getBoundingClientRect();
    const width = this.document.documentElement.clientWidth;
    const height = this.document.documentElement.clientHeight;
    const left = Math.max(8, Math.min(rect.left, width - tooltip.offsetWidth - 8));
    const below = rect.bottom + 7;
    const top = Math.max(8, below + tooltip.offsetHeight <= height - 8
      ? below : rect.top - tooltip.offsetHeight - 7);
    this.renderer.setStyle(tooltip, 'left', `${left}px`);
    this.renderer.setStyle(tooltip, 'top', `${top}px`);

    const dismiss = () => this.hide();
    this.document.addEventListener('scroll', dismiss, true);
    this.cleanups = [
      () => this.document.removeEventListener('scroll', dismiss, true),
      this.renderer.listen('window', 'resize', dismiss),
      this.renderer.listen('document', 'pointerdown', (event: PointerEvent) => {
        if (!this.element.contains(event.target as Node)) this.hide();
      }),
    ];
  }

  protected hideUnlessFocused(): void {
    if (this.document.activeElement !== this.element) this.hide();
  }

  protected hide(): void {
    if (this.tooltip) this.renderer.removeChild(this.document.body, this.tooltip);
    this.tooltip = null;
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
  }
}
