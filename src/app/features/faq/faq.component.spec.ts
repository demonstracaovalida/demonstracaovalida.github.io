import { TestBed } from '@angular/core/testing';
import { FaqComponent } from './faq.component';
import { FAQ_CATEGORIES, FAQ_ENTRIES, filterFaqEntries } from './faq-data';

describe('FAQ data', () => {
  it('contains the thirteen required questions in the five categories', () => {
    expect(FAQ_ENTRIES).toHaveLength(13);
    expect(FAQ_ENTRIES.map((entry) => entry.id)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1));
    expect(new Set(FAQ_ENTRIES.map((entry) => entry.categoria))).toEqual(new Set(FAQ_CATEGORIES));
  });

  it('searches questions and answers without case or accent sensitivity and combines category filters', () => {
    expect(filterFaqEntries(FAQ_ENTRIES, 'Todas', 'CONCILIACAO').map((entry) => entry.id))
      .toContain(1);
    expect(filterFaqEntries(FAQ_ENTRIES, 'Todas', 'horario de 8:30').map((entry) => entry.id))
      .toEqual([13]);
    expect(filterFaqEntries(FAQ_ENTRIES, 'Integrações', 'CNPJ').map((entry) => entry.id))
      .toEqual([10]);
    expect(filterFaqEntries(FAQ_ENTRIES, 'Implantação', 'CNPJ')).toEqual([]);
  });
});

describe('FaqComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FaqComponent] }).compileComponents();
  });

  it('filters in real time and resets the open answer when search or category changes', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const questionButtons = () => [...root.querySelectorAll<HTMLButtonElement>('.faq-item h2 button')];
    const category = [...root.querySelectorAll<HTMLButtonElement>('.faq-categories button')]
      .find((button) => button.textContent?.trim() === 'Integrações')!;

    expect(questionButtons()).toHaveLength(13);
    expect(root.querySelectorAll('.faq-categories button')).toHaveLength(6);
    questionButtons()[0].click();
    fixture.detectChanges();
    expect(questionButtons()[0].getAttribute('aria-expanded')).toBe('true');

    category.click();
    fixture.detectChanges();
    expect(questionButtons()).toHaveLength(2);
    expect(questionButtons()[0].getAttribute('aria-expanded')).toBe('false');
    expect(category.getAttribute('aria-pressed')).toBe('true');

    questionButtons()[0].click();
    fixture.detectChanges();
    expect(questionButtons()[0].getAttribute('aria-expanded')).toBe('true');

    const search = root.querySelector<HTMLInputElement>('#faq-search')!;
    search.value = 'CNPJ';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(questionButtons()).toHaveLength(1);
    expect(questionButtons()[0].textContent).toContain('filial ou CNPJ');
    expect(questionButtons()[0].getAttribute('aria-expanded')).toBe('false');

    search.value = 'sem resultado';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(questionButtons()).toHaveLength(0);
    expect(root.querySelector('.faq-empty')?.textContent).toContain('Nenhuma pergunta encontrada');
  });

  it('expands or collapses one answer at a time', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.faq-item h2 button')];
    const answers = [...root.querySelectorAll<HTMLElement>('.faq-answer')];

    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(answers[0].hidden).toBe(false);

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(answers[0].hidden).toBe(true);
    expect(answers[1].hidden).toBe(false);

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
    expect(answers[1].hidden).toBe(true);
  });
});
