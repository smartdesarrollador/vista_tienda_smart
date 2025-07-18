import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { BusquedaComponent } from './busqueda/busqueda.component';

@Component({
  selector: 'app-vista',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, BusquedaComponent],
  templateUrl: './vista.component.html',
  styleUrl: './vista.component.css',
})
export class VistaComponent {}
