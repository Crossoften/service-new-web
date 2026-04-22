import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthApiService } from '@features/auth/services/auth-api.service';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { User } from '@features/users/models/user.model';
import { UsersService } from '@features/users/services/users.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

Chart.register(...registerables);

interface DashboardMetricCard {
  label: string;
  value: string;
  icon: string;
  unavailable: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSkeletonComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly authApiService = inject(AuthApiService);
  private readonly usersService = inject(UsersService);

  private chart: Chart | null = null;
  private viewReady = false;

  readonly isLoading = signal(true);
  readonly users = signal<User[]>([]);
  readonly healthMessage = signal('Verificando backend...');
  readonly healthState = signal<'up' | 'down'>('down');

  readonly months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  readonly metricCards = computed<DashboardMetricCard[]>(() => [
    {
      label: 'Usuarios',
      value: String(this.users().length),
      icon: 'bi-briefcase',
      unavailable: false,
    },
    {
      label: 'Servicos',
      value: 'N/D',
      icon: 'bi-grid',
      unavailable: true,
    },
    {
      label: 'Valor em caixa',
      value: 'N/D',
      icon: 'bi-graph-up-arrow',
      unavailable: true,
    },
  ]);

  readonly usersMonthlySeries = computed(() => {
    const monthlyTotals = Array.from({ length: 12 }, () => 0);

    for (const user of this.users()) {
      const date = new Date(user.createdAt);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      monthlyTotals[date.getMonth()] += 1;
    }

    return monthlyTotals;
  });

  readonly servicesMonthlySeries = computed(() =>
    Array.from({ length: 12 }, () => null as number | null)
  );

  readonly missingEndpoints = computed(() => [
    'GET /v1/dashboard/services-count ou endpoint equivalente para o card "Servicos".',
    'GET /v1/dashboard/cash-balance ou endpoint equivalente para o card "Valor em caixa".',
    'GET /v1/dashboard/monthly-services ou endpoint equivalente para a serie mensal de servicos.',
    'GET /v1/dashboard/monthly-users ou endpoint dedicado para dashboard em producao, pois /v1/no-auth/users esta marcado como DEV ONLY.',
  ]);

  readonly existingDashboardSources = computed(() => [
    'GET /v1/no-auth/users: usado para contar usuarios e derivar a serie mensal atual.',
    'GET /v1/no-auth/health-check: usado para validar disponibilidade da API.',
    'GET /v1/my-self: disponivel para contexto do usuario autenticado, mas nao necessario para reproduzir o layout de referencia.',
  ]);

  ngOnInit(): void {
    forkJoin({
      health: this.authApiService.getHealthCheck().pipe(catchError(() => of('Backend indisponivel'))),
      users: this.usersService.getAllUsers().pipe(catchError(() => of([]))),
    }).subscribe(({ health, users }) => {
      this.healthMessage.set(health);
      this.healthState.set(health.toLowerCase().includes('indisponivel') ? 'down' : 'up');
      this.users.set(users);
      this.isLoading.set(false);
      this.refreshChart();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.refreshChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private refreshChart(): void {
    if (!this.viewReady || !this.chartCanvas) {
      return;
    }

    const usersSeries = this.usersMonthlySeries();
    const servicesSeries = this.servicesMonthlySeries();
    const chartMax = this.resolveYAxisMax(usersSeries);

    if (this.chart) {
      this.chart.data.datasets[0].data = usersSeries;
      this.chart.data.datasets[1].data = servicesSeries;
      if (this.chart.options.scales?.['y']) {
        this.chart.options.scales['y']['max'] = chartMax;
        this.chart.options.scales['y']['suggestedMax'] = chartMax;
      }
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Usuarios',
            data: usersSeries,
            borderColor: '#8a2be2',
            backgroundColor: 'rgba(138, 43, 226, 0.12)',
            borderWidth: 4,
            tension: 0.45,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: '#8a2be2',
            pointBorderColor: '#8a2be2',
          },
          {
            label: 'Servicos',
            data: servicesSeries,
            borderColor: '#7a7a7a',
            backgroundColor: 'rgba(122, 122, 122, 0.08)',
            borderWidth: 4,
            tension: 0.45,
            spanGaps: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBackgroundColor: '#7a7a7a',
            pointBorderColor: '#7a7a7a',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            titleColor: '#1a1a1a',
            bodyColor: '#5f5f5f',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
          },
        },
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        scales: {
          x: {
            grid: {
              color: '#efefef',
            },
            border: {
              display: false,
            },
            ticks: {
              color: '#4b5563',
              font: {
                size: 10,
                weight: 500,
              },
            },
          },
          y: {
            min: 0,
            max: chartMax,
            suggestedMax: chartMax,
            grid: {
              color: '#efefef',
            },
            border: {
              display: false,
            },
            ticks: {
              stepSize: Math.max(1, Math.ceil(chartMax / 5)),
              color: '#4b5563',
              font: {
                size: 10,
              },
            },
          },
        },
      },
    });
  }

  private resolveYAxisMax(values: number[]): number {
    const maxValue = Math.max(...values, 0);
    const normalized = Math.ceil(maxValue / 10) * 10;
    return Math.max(10, normalized || 10);
  }
}
