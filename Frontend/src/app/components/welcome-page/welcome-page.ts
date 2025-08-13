import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { IncidentMap } from "../incident-map/incident-map";

@Component({
  selector: 'app-welcome-page',
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    IncidentMap
  ],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css'
})
export class WelcomePage implements OnInit, AfterViewInit {

  @ViewChild('incidentMap') incidentMap!: IncidentMap;

  // Filter options
  selectedType: string = '';
  selectedSubtype: string = '';
  selectedTimeRange: string = 'all';
  selectedLocation: string = '';

  // Available options based on your backend enums
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
    { value: '7d', label: 'Poslednjih 7 dana' },
    { value: '31d', label: 'Poslednji mjesec' }
  ];

  filteredSubtypes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log("0");
    this.updateSubtypes();
    this.checkForLoginError();
  }

  ngAfterViewInit() {
    this.applyFilters();
  }

  private checkForLoginError() {
    console.log("1");
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        console.log("3");
        const errorMessage = decodeURIComponent(params['error']);
        this.showErrorSnackbar(errorMessage);

        const url = this.removeQueryParam(window.location.href, 'error');
        window.history.replaceState({}, document.title, url);
      }
    });
  }

  private showErrorSnackbar(message: string) {
    console.log("2");
    this.snackBar.open(message, 'Zatvori', {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private removeQueryParam(url: string, param: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.delete(param);
    return urlObj.pathname + urlObj.search + urlObj.hash;
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

    console.log('Primena filtera:', filters);
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

  loginWithGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  // Helper methods for template binding
  getTypeLabel(value: string): string {
    const type = this.incidentTypes.find(t => t.value === value);
    return type ? type.label : '';
  }

  getSubtypeLabel(value: string): string {
    const subtype = this.incidentSubtypes.find(s => s.value === value);
    return subtype ? subtype.label : '';
  }
}
