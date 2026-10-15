import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(`${environment.apiUrl}/procesos`);
  }
}
