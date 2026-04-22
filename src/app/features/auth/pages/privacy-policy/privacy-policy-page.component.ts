import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicTextResponse } from '../../models/auth.model';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-privacy-policy-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './privacy-policy-page.component.html',
  styleUrls: ['./privacy-policy-page.component.scss'],
})
export class PrivacyPolicyPageComponent implements OnInit {
  private readonly authApiService = inject(AuthApiService);

  readonly text = signal<PublicTextResponse | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.authApiService.getPublicText('Policies').subscribe({
      next: (response) => {
        this.text.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
