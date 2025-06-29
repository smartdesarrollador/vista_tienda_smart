import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.css'],
})
export class BackToTopComponent {
  private document = inject(DOCUMENT);
  isVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop =
      this.document.documentElement.scrollTop || this.document.body.scrollTop;
    this.isVisible = scrollTop > 300; // Mostrar después de 300px de scroll
  }

  scrollToTop(): void {
    this.document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
