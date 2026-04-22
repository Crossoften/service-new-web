import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicTextResponse } from '../../models/auth.model';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-terms-of-use-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './terms-of-use-page.component.html',
  styleUrls: ['./terms-of-use-page.component.scss'],
})
export class TermsOfUsePageComponent implements OnInit {
  private readonly authApiService = inject(AuthApiService);

  readonly text = signal<PublicTextResponse | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.authApiService.getPublicText('Terms').subscribe({
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
