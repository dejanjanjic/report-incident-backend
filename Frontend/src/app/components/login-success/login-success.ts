import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login-success',
  imports: [],
  templateUrl: './login-success.html',
  styleUrl: './login-success.css'
})
export class LoginSuccess implements OnInit, OnDestroy {

  private querySub: Subscription | undefined;

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        console.log('Primljen JWT token:', token);
        this.authService.saveToken(token);

        this.redirectToDashboard();

      } else {
        console.error('Token nije pronađen u URL-u.');
        this.router.navigate(['/']);
      }
    });
  }

  private redirectToDashboard(): void {
    const role = this.authService.getRole();
    if (role === 'ROLE_USER') {
      this.router.navigate(['/dashboard']);
    } else if (role === 'ROLE_MODERATOR') {
      this.router.navigate(['/moderator-dashboard']);
    } else {
      console.error('Nepoznata uloga korisnika:', role);
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    if (this.querySub) {
      this.querySub.unsubscribe();
    }
  }
}
