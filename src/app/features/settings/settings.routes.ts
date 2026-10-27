import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/collaborators-list/collaborators-list.component').then(
        (m) => m.CollaboratorsListComponent
      ),
    data: { title: 'Configuração' },
  },
  {
    path: 'api',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
    data: { title: 'Arquivos e perfil' },
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
    data: { title: 'Categorias' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/collaborator-form/collaborator-form.component').then(
        (m) => m.CollaboratorFormComponent
      ),
    data: { title: 'Novo Colaborador' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/collaborator-form/collaborator-form.component').then(
        (m) => m.CollaboratorFormComponent
      ),
    data: { title: 'Editar Colaborador' },
  },
];
