import { Routes } from '@angular/router';
import { WelcomePage } from './components/welcome-page/welcome-page';
import { LoginSuccess } from './components/login-success/login-success';
import { authGuard } from './guards/auth-guard';
import { ClientDashboard } from './components/client-dashboard/client-dashboard';
import { ModeratorDashboard } from './components/moderator-dashboard/moderator-dashboard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
    {path: 'welcome', component: WelcomePage},
    {path: 'login-success', component: LoginSuccess},
    {path: 'dashboard', component: ClientDashboard, canActivate: [roleGuard], data: { expectedRole: 'ROLE_USER' }},
    {path: 'moderator-dashboard', component: ModeratorDashboard, canActivate: [roleGuard], data: { expectedRole: 'ROLE_MODERATOR' }},
    {path: '', redirectTo: '/welcome', pathMatch: 'full'}
];
