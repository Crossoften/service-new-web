import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { AuthApiService } from '@features/auth/services/auth-api.service';
import { MySelfResponse } from '@features/auth/models/auth.model';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import {
  DeletedFileResponse,
  UploadedFileResponse,
  UploadsService,
} from '@core/services/uploads.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly uploadsService = inject(UploadsService);
  private readonly toastService = inject(ToastService);

  readonly currentUser = signal<MySelfResponse | null>(null);
  readonly singleUploadResult = signal<UploadedFileResponse | null>(null);
  readonly manyUploadResults = signal<UploadedFileResponse[]>([]);
  readonly fileLookupResult = signal<UploadedFileResponse | null>(null);
  readonly deletedFileResult = signal<DeletedFileResponse | null>(null);

  readonly isUploadingSingle = signal(false);
  readonly isUploadingMany = signal(false);
  readonly isLookingUpFile = signal(false);
  readonly isDeletingFile = signal(false);
  readonly isRemovingProfilePhoto = signal(false);

  readonly toolsForm = this.fb.nonNullable.group({
    fileId: ['', Validators.required],
    profileFileKey: [''],
  });

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  onSingleFileSelected(event: Event): void {
    const file = this.getFilesFromEvent(event)[0];

    if (!file) {
      return;
    }

    this.isUploadingSingle.set(true);

    this.uploadsService.uploadOne(file).subscribe({
      next: (response) => {
        this.singleUploadResult.set(response);
        this.toolsForm.controls.fileId.setValue(response.fileKey);
        this.deletedFileResult.set(null);
        this.toastService.showSuccess('Arquivo enviado com sucesso.');
        this.isUploadingSingle.set(false);
      },
      error: () => {
        this.isUploadingSingle.set(false);
      },
    });
  }

  onManyFilesSelected(event: Event): void {
    const files = this.getFilesFromEvent(event).slice(0, 5);

    if (!files.length) {
      return;
    }

    this.isUploadingMany.set(true);

    this.uploadsService.uploadMany(files).subscribe({
      next: (response) => {
        this.manyUploadResults.set(response);
        if (response[0]) {
          this.toolsForm.controls.fileId.setValue(response[0].fileKey);
        }
        this.toastService.showSuccess('Arquivos enviados com sucesso.');
        this.isUploadingMany.set(false);
      },
      error: () => {
        this.isUploadingMany.set(false);
      },
    });
  }

  lookupFile(): void {
    const fileId = this.toolsForm.controls.fileId.value.trim();

    if (!fileId) {
      this.toolsForm.controls.fileId.markAsTouched();
      return;
    }

    this.isLookingUpFile.set(true);
    this.deletedFileResult.set(null);

    this.uploadsService.getFile(fileId).subscribe({
      next: (response) => {
        this.fileLookupResult.set(response);
        this.isLookingUpFile.set(false);
      },
      error: () => {
        this.isLookingUpFile.set(false);
      },
    });
  }

  downloadFile(): void {
    const fileId = this.toolsForm.controls.fileId.value.trim();

    if (!fileId) {
      this.toolsForm.controls.fileId.markAsTouched();
      return;
    }

    this.uploadsService.downloadFile(fileId).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `arquivo-${fileId}`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
    });
  }

  deleteFile(): void {
    const fileId = this.toolsForm.controls.fileId.value.trim();

    if (!fileId) {
      this.toolsForm.controls.fileId.markAsTouched();
      return;
    }

    this.isDeletingFile.set(true);

    this.uploadsService.deleteFile(fileId).subscribe({
      next: (response) => {
        this.deletedFileResult.set(response);
        this.fileLookupResult.set(null);
        this.toastService.showSuccess('Arquivo removido com sucesso.');
        this.isDeletingFile.set(false);
      },
      error: () => {
        this.isDeletingFile.set(false);
      },
    });
  }

  removeProfilePhoto(): void {
    const fileKey =
      this.currentUser()?.fileKey || this.toolsForm.controls.profileFileKey.value.trim();

    if (!fileKey) {
      this.toastService.showError('Nenhum fileKey disponivel para remover a foto.');
      return;
    }

    this.isRemovingProfilePhoto.set(true);

    this.uploadsService.removeProfilePhoto(fileKey).subscribe({
      next: () => {
        this.toastService.showSuccess('Foto de perfil removida com sucesso.');
        const currentUser = this.currentUser();
        if (currentUser) {
          this.currentUser.set({
            ...currentUser,
            fileKey: null,
            fileUrl: null,
          });
        }
        this.toolsForm.controls.profileFileKey.setValue('');
        this.isRemovingProfilePhoto.set(false);
      },
      error: () => {
        this.isRemovingProfilePhoto.set(false);
      },
    });
  }

  private loadCurrentUser(): void {
    this.authApiService.getMySelf().subscribe({
      next: (response) => {
        this.currentUser.set(response);
        this.toolsForm.controls.profileFileKey.setValue(response.fileKey ?? '');
      },
      error: () => {
        this.currentUser.set(null);
      },
    });
  }

  private getFilesFromEvent(event: Event): File[] {
    const input = event.target as HTMLInputElement;
    return input.files ? Array.from(input.files) : [];
  }
}
