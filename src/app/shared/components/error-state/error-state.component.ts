import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.scss'],
})
export class ErrorStateComponent {
  title = input<string>();
  description = input<string>();
  isLoading = input<boolean>(false);

  retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
