import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { BackToTopComponent } from './shared/components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    BackToTopComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'proy_test';
}
