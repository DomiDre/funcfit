import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'generic',
    loadChildren: () => import('@app/modules/generic/generic.module')
                        .then(m => m.GenericModule),
    data: { animation: 'generic'}
  },
  {
    path: 'sas',
    loadChildren: () => import('@app/modules/sas/sas.module')
                        .then(m => m.SasModule),
    data: { animation: 'SAS'}
  },
  {
    path: '',
    redirectTo: 'generic',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
