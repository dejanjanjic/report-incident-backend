import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  private BASE_URL = 'http://localhost:8080/api/v1/moderation';
  constructor(private http: HttpClient) {}

  public approveIncident(incidentId: number, moderatorId: number): Observable<any> {
   
      const requestBody = {
        status: "APPROVED",
        moderationId: moderatorId|| null,
    };
    
    return this.http.put(`${this.BASE_URL}/${incidentId}/status`, requestBody);
  }

  public rejectIncident(incidentId: number, moderatorId: number): Observable<any> {
    const requestBody = {
      status: "REJECTED",
      moderationId: moderatorId || null,
    };
    return this.http.put(`${this.BASE_URL}/${incidentId}/status`, requestBody);
  }
}
