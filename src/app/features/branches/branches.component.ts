import { Component, computed, inject } from '@angular/core';
import { DemoStateService } from '../../core/demo-data/demo-state.service';

@Component({
  selector: 'app-branches',
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.css',
})
export class BranchesComponent {
  private readonly demoState = inject(DemoStateService);

  protected readonly companies = computed(() =>
    this.demoState.state().data.companies.slice(0, 4),
  );
}
