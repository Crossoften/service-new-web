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
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardCards, DashboardChart } from '../../models/dashboard.model';
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

  private readonly dashboardService = inject(DashboardService);

  private chart: Chart | null = null;
  private viewReady = false;

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly cards = signal<DashboardCards | null>(null);
  readonly chartData = signal<DashboardChart | null>(null);

  readonly months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  readonly metricCards = computed<DashboardMetricCard[]>(() => {
    const c = this.cards();
    return [
      {
        label: 'Usuários',
        value: c?.totalUsers != null ? String(c.totalUsers) : 'N/D',
        icon: 'bi-briefcase',
        unavailable: c?.totalUsers == null,
      },
      {
        label: 'Serviços',
        value: c?.totalServices != null ? String(c.totalServices) : 'N/D',
        icon: 'bi-grid',
        unavailable: c?.totalServices == null,
      },
      {
        label: 'Valor em caixa',
        value: c?.totalCashValue != null
          ? c.totalCashValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : 'N/D',
        icon: 'bi-graph-up',
        unavailable: c?.totalCashValue == null,
      },
    ];
  });

  readonly usersMonthlySeries = computed<number[]>(() => {
    const data = this.chartData();
    if (!data?.months) return Array(12).fill(0);
    return data.months.map((m) => m.users ?? 0);
  });

  readonly servicesMonthlySeries = computed<number[]>(() => {
    const data = this.chartData();
    if (!data?.months) return Array(12).fill(0);
    return data.months.map((m) => m.services ?? 0);
  });

  ngOnInit(): void {
    forkJoin({
      cards: this.dashboardService.getCards().pipe(catchError(() => of(null))),
      chart: this.dashboardService.getChart().pipe(catchError(() => of(null))),
    }).subscribe(({ cards, chart }) => {
      if (!cards && !chart) {
        this.hasError.set(true);
      }
      this.cards.set(cards);
      this.chartData.set(chart);
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
    if (!this.viewReady || this.isLoading() || !this.chartCanvas) {
      return;
    }

    const usersSeries = this.usersMonthlySeries();
    const servicesSeries = this.servicesMonthlySeries();
    const chartMax = this.resolveYAxisMax([...usersSeries, ...servicesSeries]);

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
            label: 'Usuários',
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
            label: 'Serviços',
            data: servicesSeries,
            borderColor: '#7a7a7a',
            backgroundColor: 'rgba(122, 122, 122, 0.08)',
            borderWidth: 4,
            tension: 0.45,
            spanGaps: false,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: '#111111',
            pointBorderColor: '#111111',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
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
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            grid: { color: '#efefef' },
            border: { display: false },
            ticks: { color: '#4b5563', font: { size: 10, weight: 500 } },
          },
          y: {
            min: 0,
            max: chartMax,
            suggestedMax: chartMax,
            grid: { color: '#efefef' },
            border: { display: false },
            ticks: {
              stepSize: Math.max(1, Math.ceil(chartMax / 5)),
              color: '#4b5563',
              font: { size: 10 },
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
