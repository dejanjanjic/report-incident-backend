import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModeratorIncidentMap } from '../moderator-incident-map/moderator-incident-map';
import { IncidentService } from '../../services/incident-service';
import { of, switchMap, catchError, EMPTY } from 'rxjs';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-moderator-dashboard',
  imports: [CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ModeratorIncidentMap],
  templateUrl: './moderator-dashboard.html',
  styleUrl: './moderator-dashboard.css'
})
export class ModeratorDashboard implements OnInit, AfterViewInit{
  @ViewChild('incidentMap') incidentMap!: ModeratorIncidentMap;

  selectedType: string = '';
  selectedSubtype: string = '';
  selectedTimeRange: string = 'all';
  selectedLocation: string = '';

  reportType: string = '';
  reportSubtype: string = '';
  reportDescription: string = '';
  reportLocation: any = null;
  selectedFiles: File[] = [];
  isSubmitting: boolean = false;

  incidentTypes = [
    { value: 'FIRE', label: 'Požar' },
    { value: 'FLOOD', label: 'Poplava' },
    { value: 'ACCIDENT', label: 'Nesreća' },
    { value: 'CRIME', label: 'Kriminal' }
  ];

  incidentSubtypes = [
    { value: 'CAR_ACCIDENT', label: 'Saobraćajna nesreća', type: 'ACCIDENT' },
    { value: 'BUILDING_FIRE', label: 'Požar zgrade', type: 'FIRE' },
    { value: 'ROBBERY', label: 'Krađa', type: 'CRIME' },
    { value: 'ASSAULT', label: 'Napad', type: 'CRIME' }
  ];

  timeRanges = [
    { value: 'all', label: 'Svi incidenti' },
    { value: '24h', label: 'Poslednja 24h' },
    { value: '7d', label: 'Poslednja 7 dana' },
    { value: '31d', label: 'Poslednji mjesec' }
  ];

  filteredSubtypes: any[] = [];
  reportFilteredSubtypes: any[] = [];

  constructor(
    private incidentService: IncidentService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateSubtypes();
    this.updateReportSubtypes();
  }

  ngAfterViewInit() {
    this.applyFilters();
  }

  onTypeChange() {
    this.selectedSubtype = '';
    this.updateSubtypes();
    this.applyFilters();
  }

  updateSubtypes() {
    if (this.selectedType) {
      this.filteredSubtypes = this.incidentSubtypes.filter(
        subtype => subtype.type === this.selectedType
      );
    } else {
      this.filteredSubtypes = this.incidentSubtypes;
    }
  }

  onSubtypeChange() {
    this.applyFilters();
  }

  onTimeRangeChange() {
    this.applyFilters();
  }

  onLocationChange() {
    this.applyFilters();
  }

  applyFilters() {
    if (!this.incidentMap) {
      return;
    }

    const filters = {
      incidentType: this.selectedType,
      incidentSubtype: this.selectedSubtype,
      timeRange: this.selectedTimeRange,
      location: this.selectedLocation
    };
    
    this.incidentMap.updateIncidents(filters);
  }

  clearFilters() {
    this.selectedType = '';
    this.selectedSubtype = '';
    this.selectedTimeRange = 'all';
    this.selectedLocation = '';
    this.updateSubtypes();
    this.applyFilters();
  }

  onReportTypeChange() {
    this.reportSubtype = '';
    this.updateReportSubtypes();
  }

  updateReportSubtypes() {
    if (this.reportType) {
      this.reportFilteredSubtypes = this.incidentSubtypes.filter(
        subtype => subtype.type === this.reportType
      );
    } else {
      this.reportFilteredSubtypes = this.incidentSubtypes;
    }
  }

  onMapLocationSelected(location: any) {
    this.reportLocation = location;
  }

  onFileSelected(event: any) {
    const newFiles = Array.from(event.target.files as File[]);
  this.selectedFiles = [...this.selectedFiles, ...newFiles];
  }

  submitIncident() {
  if (!this.reportType || !this.reportLocation) {
    this.snackBar.open('Tip incidenta i lokacija su obavezni!', 'Zatvori', {
      duration: 3000,
      panelClass: ['error-snack']
    });
    return;
  }


  const fileUpload$ = this.selectedFiles.length > 0
    ? this.incidentService.uploadFiles(this.prepareFormData())
    : of([]);

  fileUpload$.pipe(
    switchMap((imageUrls: string[]) => {
      const incidentData = {
        type: this.reportType,
        subtype: this.reportSubtype || null,
        location: this.reportLocation,
        description: this.reportDescription || '',
        images: imageUrls.map(url => ({ imageUrl: url }))
      };
      return this.incidentService.createIncident(incidentData);
    }),
    catchError(error => {
      console.error('Došlo je do greške pri prijavi incidenta:', error);
      this.snackBar.open('Došlo je do greške pri prijavi incidenta!', 'Zatvori', {
        duration: 5000,
        panelClass: ['error-snack']
      });
      return EMPTY;
    })
  ).subscribe({
    next: () => {
      this.snackBar.open('Incident je uspešno prijavljen!', 'Zatvori', {
        duration: 5000,
        panelClass: ['success-snack']
      });
      this.resetReportForm();
      this.applyFilters();
    }
  });
}


  private prepareFormData(): FormData {
  const formData = new FormData();
  this.selectedFiles.forEach(file => {
    formData.append('file', file);
  });
  return formData;
}


  resetReportForm() {
    this.reportType = '';
    this.reportSubtype = '';
    this.reportDescription = '';
    this.reportLocation = null;
    this.selectedFiles = [];
    this.updateReportSubtypes();
    
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    if (this.incidentMap) {
      this.incidentMap.clearSelectedLocation();
    }
  }

  getTypeLabel(value: string): string {
    const type = this.incidentTypes.find(t => t.value === value);
    return type ? type.label : '';
  }

  getSubtypeLabel(value: string): string {
    const subtype = this.incidentSubtypes.find(s => s.value === value);
    return subtype ? subtype.label : '';
  }

  getLocationDisplay(): string {
    if (!this.reportLocation) return 'Kliknite na mapu da izaberete lokaciju';
    return `${this.reportLocation.address || 'Nepoznata adresa'}, ${this.reportLocation.city || 'Nepoznat grad'}`;
  }

  logout() {
    this.authService.logout();
  }
}
