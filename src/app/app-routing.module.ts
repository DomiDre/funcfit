import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@app/modules/landing-page/landing-page.module')
                        .then(m => m.LandingPageModule)
  }, {
    path: 'generic',
    loadChildren: () => import('@app/modules/generic/generic.module')
                        .then(m => m.GenericModule)
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
