import { Component, OnInit, AfterViewInit, inject, Output, EventEmitter, Input } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import { IncidentService } from '../../services/incident-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-incident-map',
  standalone: true,
  imports: [LeafletModule],
  templateUrl: './incident-map.html',
  styleUrl: './incident-map.css'
})
export class IncidentMap implements OnInit, AfterViewInit {
  @Output() locationSelected = new EventEmitter<any>();
  @Input() reportingEnabled: boolean = false;

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private selectedLocationMarker: L.Marker | null = null;
  private incidentService = inject(IncidentService);
  private authService = inject(AuthService);

  private currentFilters: any = {};
  
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

    this.incidentService.filterApprovedIncidents(this.currentFilters).subscribe({
      next: (response: any) => {
        const incidents = response.content as any[]; 

        incidents.forEach(incident => {
          if (incident.location && incident.location.latitude && incident.location.longitude) {
            const incidentIcon = L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
              className: this.getIncidentMarkerClass(incident.type)
            });

            const marker = L.marker([incident.location.latitude, incident.location.longitude], { 
              icon: incidentIcon 
            });

            const popupContent = `
              <div class="incident-popup">
                <h4>${this.getIncidentTypeLabel(incident.type)}</h4>
                <p><strong>Podvrsta:</strong> ${this.getIncidentSubtypeLabel(incident.subtype)}</p>
                <p><strong>Opis:</strong> ${incident.description}</p>
                <p><strong>Lokacija:</strong> ${incident.location.address + ', ' + incident.location.city || 'N/A'}</p>
                <p><strong>Prijavljeno:</strong> ${new Date(incident.reportedAt).toLocaleString('sr-RS')}</p>
              </div>
            `;

            marker.bindPopup(popupContent);
            this.markersLayer.addLayer(marker);
          }
        });
      },
      error: (err) => {
        console.error('Došlo je do greške prilikom filtriranja incidenata:', err);
      }
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
}