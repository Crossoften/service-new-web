import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

Chart.register(...registerables);

interface StatCard {
  label: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  readonly stats: StatCard[] = [
    { label: 'Usuários',      value: 300,   icon: 'bi-briefcase'      },
    { label: 'Serviços',      value: 2000,  icon: 'bi-grid'           },
    { label: 'Valor em caixa',value: 30000, icon: 'bi-graph-up-arrow' },
  ];

  private readonly months = [
    'JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ',
  ];

  private readonly usuariosData = [5, 28, 55, 92, 88, 20, 21, 37, 5, 47, 30, 8];
  private readonly servicosData  = [18, 19, 50, 26, 86, 22, 19, 18, 39, 43, 18, 8];

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private initChart(): void {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Usuários',
            data: this.usuariosData,
            borderColor: '#8308d2',
            backgroundColor: 'rgba(131, 8, 210, 0.07)',
            borderWidth: 2.5,
            tension: 0.4,
            pointBackgroundColor: '#8308d2',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
          },
          {
            label: 'Serviços',
            data: this.servicosData,
            borderColor: '#444444',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderWidth: 2.5,
            tension: 0.4,
            pointBackgroundColor: '#444444',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              font: { size: 12 },
              color: '#444',
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            titleColor: '#1a1a1a',
            bodyColor: '#5f5f5f',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
          },
        },
        scales: {
          x: {
            grid: { color: '#ffffff', lineWidth: 1 },
            border: { display: false },
            ticks: { color: '#5f5f5f', font: { size: 11 } },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: '#ffffff', lineWidth: 1 },
            border: { display: false },
            ticks: {
              color: '#5f5f5f',
              font: { size: 11 },
              stepSize: 10,
            },
          },
        },
      },
    });
  }
}
