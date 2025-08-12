import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private BASE_URL = 'http://localhost:8080/api/v1/incidents';
  constructor(private http: HttpClient) {}

  public getAll() {
    return this.http.get(this.BASE_URL);
  }

  public getAllApproved() {
    return this.http.get(this.BASE_URL + '?status=APPROVED');
  }

  public filterIncidents(filters: any, page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

      const filterRequest = {
        incidentType: filters.incidentType || null,
        incidentSubtype: filters.incidentSubtype || null,
        location: filters.location || null,
        timeRange: filters.timeRange !== 'all' ? filters.timeRange : null,
        status: filters.status || null
    };
    
    return this.http.post(`${this.BASE_URL}/filter`, filterRequest, { params });
  }
  public filterApprovedIncidents(filters: any, page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const filterRequest = {
        incidentType: filters.incidentType || null,
        incidentSubtype: filters.incidentSubtype || null,
        location: filters.location || null,
        timeRange: filters.timeRange !== 'all' ? filters.timeRange : null,
        status: 'APPROVED'
    };
    
    return this.http.post(`${this.BASE_URL}/filter`, filterRequest, { params });
  }

  public createIncident(incidentData: any): Observable<any> {
    return this.http.post(this.BASE_URL, incidentData);
  }

  public uploadFiles(formData: FormData): Observable<string[]> {
    return this.http.post<string[]>(`${this.BASE_URL}/upload`, formData);
  }
}
