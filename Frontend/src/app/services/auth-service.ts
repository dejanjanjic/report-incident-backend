import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

interface DecodedToken {
  sub: string;
  id: number;
  role: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) { }

  public getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  public saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  public logout(): void {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/welcome']);
  }

  public getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode<DecodedToken>(token);
      } catch (error) {
        console.error("Greška prilikom dekodiranja tokena:", error);
        this.logout();
        return null;
      }
    }
    return null;
  }
  
  public getRole(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? decodedToken.role : null;
  }

  public getUserId(): number | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? decodedToken.id : null;
  }
  
  public isLoggedIn(): boolean {
    const token = this.getDecodedToken();
    if (!token) {
      return false;
    }
    const isExpired = token.exp * 1000 < Date.now();
    return !isExpired;
  }
}