import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IllustrativeControlDirective } from './illustrative-control.directive';

@Component({
  imports: [IllustrativeControlDirective],
  template: '<form (submit)="submissions = submissions + 1"><button appIllustrative>PDF</button></form>',
})
class TestHost {
  submissions = 0;
}

describe('IllustrativeControlDirective', () => {
  it('explains an unavailable control on keyboard focus or click without submitting its form', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.dispatchEvent(new FocusEvent('focus'));
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Indisponível nesta prévia');
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    button.click();
    expect(fixture.componentInstance.submissions).toBe(0);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    fixture.destroy();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('dismisses the explanation when the visitor scrolls or taps elsewhere', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    button.dispatchEvent(new MouseEvent('mouseenter'));
    document.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    button.click();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    fixture.destroy();
  });
});
