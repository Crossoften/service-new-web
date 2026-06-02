import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';

@Component({
  selector: 'app-contract-gap-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './contract-gap-page.component.html',
  styleUrls: ['./contract-gap-page.component.scss'],
})
export class ContractGapPageComponent {
  private readonly route = inject(ActivatedRoute);

  get title(): string {
    return this.route.snapshot.data['moduleTitle'] || 'Modulo';
  }

  get summary(): string {
    return (
      this.route.snapshot.data['summary'] ||
      'O backend documentado ainda não disponibiliza endpoints para esta área da aplicação.'
    );
  }

  get actionLabel(): string {
    return this.route.snapshot.data['actionLabel'] || 'Voltar';
  }

  get actionRoute(): string {
    return this.route.snapshot.data['actionRoute'] || '/dashboard';
  }

  get missingEndpoints(): string[] {
    return this.route.snapshot.data['missingEndpoints'] || [];
  }
}
