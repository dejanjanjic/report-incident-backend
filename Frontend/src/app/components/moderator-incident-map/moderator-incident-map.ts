import { Component, OnInit, AfterViewInit, inject, Output, EventEmitter, Input } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import { IncidentService } from '../../services/incident-service';
import { AuthService } from '../../services/auth-service';
import { ModerationService } from '../../services/moderation-service';
import {MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-moderator-incident-map',
  imports: [LeafletModule, MatSnackBarModule],
  templateUrl: './moderator-incident-map.html',
  styleUrl: './moderator-incident-map.css'
})
export class ModeratorIncidentMap implements OnInit, AfterViewInit  {
  @Output() locationSelected = new EventEmitter<any>();
  @Input() reportingEnabled: boolean = false;

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private selectedLocationMarker: L.Marker | null = null;
  private incidentService = inject(IncidentService);
  private authService = inject(AuthService);
  private moderationService = inject(ModerationService);
  private snackBar = inject(MatSnackBar)

  private currentFilters: any = {};
  private incidents: any[] = []; // Čuva listu incidenata
  
  options = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '© OpenStreetMap contributors',
      }),
    ],
    zoom: 13,
    center: L.latLng(44.76662491169107, 17.1870092734517),
  };

  ngOnInit() {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.markersLayer.addTo(this.map);
    
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
    
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  private async onMapClick(e: L.LeafletMouseEvent) {
    if (!this.reportingEnabled) {
      return;
    }

    const latlng = e.latlng;
    
    if (this.selectedLocationMarker) {
      this.map.removeLayer(this.selectedLocationMarker);
    }

    const selectedIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: 'selected-location-marker'
    });

    this.selectedLocationMarker = L.marker(latlng, { icon: selectedIcon })
      .addTo(this.map)
      .bindPopup('Odabrana lokacija za prijavu incidenta')
      .openPopup();

    try {
      const address = await this.reverseGeocode(latlng.lat, latlng.lng);
      
      const locationData = {
        latitude: latlng.lat,
        longitude: latlng.lng,
        address: address.address,
        city: address.city,
        country: address.country || 'Bosnia and Herzegovina'
      };

      this.locationSelected.emit(locationData);

      if (this.selectedLocationMarker) {
        this.selectedLocationMarker.setPopupContent(`
          <div class="selected-location-popup">
            <h4>Odabrana lokacija</h4>
            <p><strong>Adresa:</strong> ${address.address || 'Nepoznata adresa'}</p>
            <p><strong>Grad:</strong> ${address.city || 'Nepoznat grad'}</p>
            <p><strong>Koordinate:</strong> ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</p>
          </div>
        `);
      }

    } catch (error) {
      console.error('Greška pri dobijanju adrese:', error);
      
      const locationData = {
        latitude: latlng.lat,
        longitude: latlng.lng,
        address: 'Nepoznata adresa',
        city: 'Nepoznat grad',
        country: 'Bosnia and Herzegovina'
      };

      this.locationSelected.emit(locationData);
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      return {
        address: this.formatAddress(data.address),
        city: data.address?.city || data.address?.town || data.address?.village || 'Nepoznat grad',
        country: data.address?.country || 'Bosnia and Herzegovina'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        address: 'Nepoznata adresa',
        city: 'Nepoznat grad',
        country: 'Bosnia and Herzegovina'
      };
    }
  }

  private formatAddress(address: any): string {
    if (!address) return 'Nepoznata adresa';

    const parts = [];
    
    if (address.house_number && address.road) {
      parts.push(`${address.road} ${address.house_number}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    if (address.suburb) {
      parts.push(address.suburb);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Nepoznata adresa';
  }

  private loadIncidents() {
    if (!this.map) return;

    this.markersLayer.clearLayers();

    this.incidentService.filterIncidents(this.currentFilters).subscribe({
      next: (response: any) => {
        this.incidents = response.content as any[]; // Sačuvaj incidente

        this.incidents.forEach((incident, index) => {
          if (incident.location && incident.location.latitude && incident.location.longitude) {
            // Odaberi ikonu na osnovu statusa
            const incidentIcon = this.getMarkerIconByStatus(incident.status);

            const marker = L.marker([incident.location.latitude, incident.location.longitude], { 
              icon: incidentIcon 
            });

            // Dodeli jedinstveni ID markeru za kasnije prepoznavanje
            (marker as any).incidentId = incident.id;
            (marker as any).incidentIndex = index;

            const popupContent = this.createPopupContent(incident);
            marker.bindPopup(popupContent);

            // Dodaj event listener za otvaranje popup-a
            marker.on('popupopen', () => {
              this.attachPopupEventListeners(incident.id);
            });

            this.markersLayer.addLayer(marker);
          }
        });
      },
      error: (err) => {
        console.error('Došlo je do greške prilikom filtriranja incidenata:', err);
      }
    });
  }

  private createPopupContent(incident: any): string {
    let popupContent = `
      <div class="incident-popup">
        <h4>${this.getIncidentTypeLabel(incident.type)}</h4>
        <p><strong>Status:</strong> <span class="status-${incident.status.toLowerCase()}">${this.getIncidentStatusLabel(incident.status)}</span></p>
        <p><strong>Podvrsta:</strong> ${this.getIncidentSubtypeLabel(incident.subtype)}</p>
        <p><strong>Opis:</strong> ${incident.description}</p>
        <p><strong>Lokacija:</strong> ${incident.location.address + ', ' + incident.location.city || 'N/A'}</p>
        <p><strong>Prijavljeno:</strong> ${new Date(incident.reportedAt).toLocaleString('sr-RS')}</p>
        <p><strong>Slike:</strong></p>
        <div class="incident-images">`;
    
    for (const image of incident.images || []) {
      popupContent += `<a href="${image.imageUrl}" target="_blank"><img src="${image.imageUrl}" alt="Incident Image" class="incident-image" style="height: 60px;margin:5px; border-radius: 4px;"/></a>`;
    }
    
    popupContent += `</div>`;
    
    // Dodaj dugmad za moderaciju ako je status PENDING
    if (incident.status === 'PENDING') {
      popupContent += `
        <div class="moderation-actions" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
          <h5 style="margin: 0 0 10px 0; color: #333;">Moderacija:</h5>
          <div class="action-buttons">
            <button 
              id="approve-btn-${incident.id}"
              class="approve-btn" 
              style="
                background: #28a745; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer;
                margin-right: 8px;
                font-size: 12px;
                font-weight: 500;
              "
            >
              ✓ Odobri
            </button>
            <button 
              id="reject-btn-${incident.id}"
              class="reject-btn" 
              style="
                background: #dc3545; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
              "
            >
              ✗ Odbaci
            </button>
          </div>
        </div>
      `;
    }
    
    popupContent += `</div>`;
    
    return popupContent;
  }

  private attachPopupEventListeners(incidentId: number) {
    // Koristi setTimeout da osigurava da je DOM spreman
    setTimeout(() => {
      const approveBtn = document.getElementById(`approve-btn-${incidentId}`);
      const rejectBtn = document.getElementById(`reject-btn-${incidentId}`);

      if (approveBtn) {
        approveBtn.addEventListener('click', () => {
          this.approveIncident(incidentId);
        });
        
        // Dodaj hover efekte
        approveBtn.addEventListener('mouseenter', () => {
          approveBtn.style.background = '#218838';
        });
        approveBtn.addEventListener('mouseleave', () => {
          approveBtn.style.background = '#28a745';
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          this.rejectIncident(incidentId);
        });
        
        // Dodaj hover efekte
        rejectBtn.addEventListener('mouseenter', () => {
          rejectBtn.style.background = '#c82333';
        });
        rejectBtn.addEventListener('mouseleave', () => {
          rejectBtn.style.background = '#dc3545';
        });
      }
    }, 10);
  }

  private getMarkerIconByStatus(status: string): L.Icon {
    let iconUrl: string;
    let className: string;

    switch (status) {
      case 'APPROVED':
        // Obični plavi marker za odobrene incidente
        iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
        className = 'approved-marker';
        break;
      case 'PENDING':
        // Crveni marker za pending incidente
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
        className = 'pending-marker';
        break;
      case 'REPORTED':
      case 'REJECTED':
      default:
        // Sivi marker za ostale statuse
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png';
        className = 'other-status-marker';
        break;
    }

    return L.icon({
      iconUrl: iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: className
    });
  }

  private getIncidentMarkerClass(type: string): string {
    switch (type) {
      case 'FIRE': return 'fire-marker';
      case 'FLOOD': return 'flood-marker';
      case 'ACCIDENT': return 'accident-marker';
      case 'CRIME': return 'crime-marker';
      default: return 'default-marker';
    }
  }

  private getIncidentTypeLabel(type: string): string {
    switch (type) {
      case 'FIRE': return 'Požar';
      case 'FLOOD': return 'Poplava';
      case 'ACCIDENT': return 'Nesreća';
      case 'CRIME': return 'Kriminal';
      default: return '/';
    }
  }

  private getIncidentSubtypeLabel(subtype: string): string {
    switch (subtype) {
      case 'CAR_ACCIDENT': return 'Saobraćajna nesreća';
      case 'BUILDING_FIRE': return 'Požar zgrade';
      case 'ROBBERY': return 'Krađa';
      case 'ASSAULT': return 'Napad';
      default: return '/';
    }
  }

  private getIncidentStatusLabel(status: string): string {
    switch (status) {
      case 'REPORTED': return 'Prijavljen';
      case 'PENDING': return 'Na čekanju';
      case 'APPROVED': return 'Odobren';
      case 'REJECTED': return 'Odbačen';
      default: return status;
    }
  }

  public updateIncidents(filters: any) {
    this.currentFilters = filters;
    this.loadIncidents();
  }

  public clearSelectedLocation() {
    if (this.selectedLocationMarker) {
      this.map.removeLayer(this.selectedLocationMarker);
      this.selectedLocationMarker = null;
    }
  }

  
  private approveIncident(incidentId: number) {
    console.log('Odobravamo incident sa ID:', incidentId);

    const moderatorId = this.authService.getUserId()!;
    
    this.moderationService.approveIncident(incidentId, moderatorId).subscribe({
      next: (response) => {
        console.log('Incident odobren:', response);

        this.snackBar.open('Incident je uspešno odobren!', 'Zatvori', {
        duration: 5000,
        panelClass: ['success-snack']
      });

        this.loadIncidents();
        this.map.closePopup();
      },
      error: (error) => {
        this.snackBar.open('Greska pri odobravanju!', 'Zatvori', {
        duration: 5000,
        panelClass: ['error-snack']
      });
        console.error('Greška pri odobravanju:', error);
      }
    });
  }

  private rejectIncident(incidentId: number) {
    console.log('Odbacujemo incident sa ID:', incidentId);

    const moderatorId = this.authService.getUserId()!;
    
    this.moderationService.rejectIncident(incidentId, moderatorId).subscribe({
      next: (response) => {
        this.snackBar.open('Incident je uspešno odbacen!', 'Zatvori', {
        duration: 5000,
        panelClass: ['success-snack']
      });
        console.log('Incident odbačen:', response);
        this.loadIncidents();
        this.map.closePopup();
      },
      error: (error) => {
        this.snackBar.open('Greska pri odbacivanju!', 'Zatvori', {
      duration: 3000,
      panelClass: ['error-snack']
    });
        console.error('Greška pri odbacivanju:', error);
      }
    });
  }
}