import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styleUrls: ['./loading-skeleton.component.scss'],
})
export class LoadingSkeletonComponent {
  variant = input<'card' | 'list' | 'table'>('card');
  count = input<number>(3);

  get skeletonItems(): number[] {
    return Array(this.count()).fill(0);
  }
}
