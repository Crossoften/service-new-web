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

  private chart: Chart<'line'> | null = null;
  private viewReady = false;

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly cards = signal<DashboardCards | null>(null);
  readonly chartData = signal<DashboardChart | null>(null);
  readonly metricCards = computed<DashboardMetricCard[]>(() => {
    const c = this.cards();
    return [
      {
        label: 'Usuários',
        value: c?.totalUsers != null ? String(c.totalUsers) : 'Não informado',
        icon: 'bi-briefcase',
        unavailable: c?.totalUsers == null,
      },
      {
        label: 'Serviços',
        value: c?.totalServices != null ? String(c.totalServices) : 'Não informado',
        icon: 'bi-grid',
        unavailable: c?.totalServices == null,
      },
      {
        label: 'Valor em caixa',
        value:
          c?.totalCashValue != null
            ? c.totalCashValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'Não informado',
        icon: 'bi-graph-up',
        unavailable: c?.totalCashValue == null,
      },
    ];
  });

  readonly usersMonthlySeries = computed<number[]>(() => {
    const data = this.chartData();
    if (!data?.months?.length) return [];
    return data.months.map((m) => m.users ?? 0);
  });

  readonly servicesMonthlySeries = computed<number[]>(() => {
    const data = this.chartData();
    if (!data?.months?.length) return [];
    return data.months.map((m) => m.services ?? 0);
  });

  readonly chartLabels = computed<string[]>(
    () => this.chartData()?.months.map((m) => m.month) ?? []
  );
  readonly hasChartData = computed(() => this.chartLabels().length > 0);

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
      setTimeout(() => this.refreshChart());
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
    if (!this.hasChartData()) {
      this.chart?.destroy();
      this.chart = null;
      return;
    }

    const chartMax = this.resolveYAxisMax([...usersSeries, ...servicesSeries]);
    const isMobile = this.isMobileChart();

    if (this.chart) {
      this.chart.data.labels = this.chartLabels();
      this.chart.data.datasets[0].data = usersSeries;
      this.chart.data.datasets[1].data = servicesSeries;
      this.chart.data.datasets[0].borderWidth = isMobile ? 3 : 4;
      this.chart.data.datasets[1].borderWidth = isMobile ? 3 : 4;
      this.chart.data.datasets[0].pointRadius = isMobile ? 3 : 4;
      this.chart.data.datasets[1].pointRadius = isMobile ? 3 : 4;
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
        labels: this.chartLabels(),
        datasets: [
          {
            label: 'Usuários',
            data: usersSeries,
            borderColor: '#8a2be2',
            backgroundColor: 'rgba(138, 43, 226, 0.12)',
            borderWidth: isMobile ? 3 : 4,
            tension: 0.38,
            pointRadius: isMobile ? 3 : 4,
            pointHoverRadius: isMobile ? 4 : 5,
            pointBackgroundColor: '#8a2be2',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
          {
            label: 'Serviços',
            data: servicesSeries,
            borderColor: '#363636',
            backgroundColor: 'rgba(54, 54, 54, 0.08)',
            borderWidth: isMobile ? 3 : 4,
            tension: 0.38,
            spanGaps: false,
            pointRadius: isMobile ? 3 : 4,
            pointHoverRadius: isMobile ? 4 : 5,
            pointBackgroundColor: '#363636',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
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
            bodyColor: '#374151',
            borderColor: 'rgba(17, 24, 39, 0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 12,
            displayColors: true,
            boxPadding: 4,
            titleFont: { size: 11, weight: 700 },
            bodyFont: { size: 11, weight: 500 },
          },
        },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 8, right: isMobile ? 2 : 10, bottom: 0, left: 0 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              color: '#6b7280',
              padding: 8,
              font: { size: isMobile ? 9 : 10, weight: 700 },
              callback: (_value, index) =>
                isMobile && index % 2 !== 0 ? '' : this.chartLabels()[index],
            },
          },
          y: {
            min: 0,
            max: chartMax,
            suggestedMax: chartMax,
            grid: { color: 'rgba(17, 24, 39, 0.06)' },
            border: { display: false },
            ticks: {
              maxTicksLimit: isMobile ? 4 : 6,
              stepSize: Math.max(1, Math.ceil(chartMax / (isMobile ? 3 : 5))),
              color: '#6b7280',
              padding: 6,
              font: { size: isMobile ? 9 : 10, weight: 600 },
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

  private isMobileChart(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 480;
  }
}
