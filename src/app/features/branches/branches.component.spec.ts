import { TestBed } from '@angular/core/testing';
import { DemoStateService } from '../../core/demo-data/demo-state.service';
import { BranchesComponent } from './branches.component';

describe('BranchesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BranchesComponent] }).compileComponents();
  });

  it('renders the four demo companies from the shared state and marks the open company', () => {
    const fixture = TestBed.createComponent(BranchesComponent);
    fixture.detectChanges();

    const expected = TestBed.inject(DemoStateService).state().data.companies;
    const rendered = fixture.nativeElement as HTMLElement;
    const rows = [...rendered.querySelectorAll<HTMLTableRowElement>('tbody tr')];

    expect(rows).toHaveLength(4);
    expected.forEach((company, index) => {
      expect([...rows[index].cells].map((cell) => cell.textContent?.trim())).toEqual([
        company.cnpj,
        company.legalName,
        company.tradeName,
      ]);
      expect(rows[index].classList.contains('current-company')).toBe(company.isCurrentCompany);
    });
    expect(rows[0].cells[0].textContent?.trim()).toBe('10723113000179');
    expect(rows[0].cells[1].textContent?.trim()).toBe('CONCILIADOR DEMONSTRAÇÃO');
  });

  it('moves the highlight when the open company changes in memory', () => {
    const fixture = TestBed.createComponent(BranchesComponent);
    fixture.detectChanges();

    TestBed.inject(DemoStateService).update((session) => ({
      ...session,
      data: {
        ...session.data,
        companies: session.data.companies.map((company) => ({
          ...company,
          isCurrentCompany: company.id === 'filial-2',
        })),
      },
    }));
    fixture.detectChanges();

    const rendered = fixture.nativeElement as HTMLElement;
    const highlighted = rendered.querySelectorAll<HTMLTableRowElement>(
      'tbody tr.current-company',
    );
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].cells[1].textContent?.trim()).toBe('Filial 2');
  });
});
