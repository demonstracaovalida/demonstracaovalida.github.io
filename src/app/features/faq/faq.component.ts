import { Component, computed, signal } from '@angular/core';
import { FAQ_CATEGORIES, FAQ_ENTRIES, filterFaqEntries, type FaqCategory } from './faq-data';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  protected readonly categories = FAQ_CATEGORIES;
  protected readonly category = signal<FaqCategory | 'Todas'>('Todas');
  protected readonly search = signal('');
  protected readonly expandedId = signal<number | null>(null);
  protected readonly questions = computed(() =>
    filterFaqEntries(FAQ_ENTRIES, this.category(), this.search()),
  );

  protected selectCategory(category: FaqCategory | 'Todas'): void {
    this.category.set(category);
    this.expandedId.set(null);
  }

  protected updateSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.search.set(event.target.value);
    this.expandedId.set(null);
  }

  protected toggleQuestion(id: number): void {
    this.expandedId.update((current) => current === id ? null : id);
  }
}
