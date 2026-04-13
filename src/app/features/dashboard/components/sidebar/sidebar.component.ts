import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '@core/services/toast.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  implemented: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly navItems: NavItem[] = [
    { label: 'DASHBOARD',   icon: 'bi-speedometer2',    route: '/dashboard', implemented: true  },
    { label: 'PARCEIROS',   icon: 'bi-building',        route: '/suppliers', implemented: true  },
    { label: 'USUÁRIOS',    icon: 'bi-people',          route: '/users',     implemented: true  },
    { label: 'SERVIÇOS',    icon: 'bi-grid',            route: '/services',  implemented: true  },
    { label: 'FINANCEIRO',  icon: 'bi-graph-up',        route: '/finance',   implemented: true  },
    { label: 'CONFIGURAÇÃO',icon: 'bi-gear',            route: '/settings',  implemented: true  },
  ];

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onNavClick(item: NavItem, event: MouseEvent): void {
    event.preventDefault();
    if (!item.implemented) {
      this.toastService.showInfo('Este módulo está em desenvolvimento.');
      return;
    }
    this.router.navigate([item.route]);
  }

  logout(): void {
    this.router.navigate(['/auth/login']);
  }
}
