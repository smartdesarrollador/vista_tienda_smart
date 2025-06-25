import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PaginationConfig,
  PageChangeEvent,
  PageSizeChangeEvent,
} from '../../../core/models/pagination.interface';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent implements OnInit, OnChanges {
  // Required inputs
  @Input({ required: true }) totalItems!: number;
  @Input({ required: true }) currentPage!: number;
  @Input({ required: true }) itemsPerPage!: number;

  // Optional configuration inputs
  @Input() maxVisiblePages: number = 5;
  @Input() showFirstLast: boolean = true;
  @Input() showPrevNext: boolean = true;
  @Input() showPageNumbers: boolean = true;
  @Input() showPageSize: boolean = true;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() showItemsInfo: boolean = true;
  @Input() disabled: boolean = false;

  // Outputs
  @Output() pageChange = new EventEmitter<PageChangeEvent>();
  @Output() pageSizeChange = new EventEmitter<PageSizeChangeEvent>();

  // Signals para estado interno
  private _totalItems = signal(0);
  private _currentPage = signal(1);
  private _itemsPerPage = signal(10);

  // Computed signals para cálculos
  totalPages = computed(() =>
    Math.ceil(this._totalItems() / this._itemsPerPage())
  );

  startItem = computed(() => {
    const start = (this._currentPage() - 1) * this._itemsPerPage() + 1;
    return Math.min(start, this._totalItems());
  });

  endItem = computed(() => {
    const end = this._currentPage() * this._itemsPerPage();
    return Math.min(end, this._totalItems());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this._currentPage();
    const maxVisible = this.maxVisiblePages;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);

    // Ajustar si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // Estados de botones
  isFirstPage = computed(() => this._currentPage() === 1);
  isLastPage = computed(() => this._currentPage() === this.totalPages());
  hasPreviousPage = computed(() => this._currentPage() > 1);
  hasNextPage = computed(() => this._currentPage() < this.totalPages());

  ngOnInit(): void {
    this.updateSignals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['totalItems'] ||
      changes['currentPage'] ||
      changes['itemsPerPage']
    ) {
      this.updateSignals();
    }
  }

  private updateSignals(): void {
    this._totalItems.set(this.totalItems);
    this._currentPage.set(this.currentPage);
    this._itemsPerPage.set(this.itemsPerPage);
  }

  /**
   * Navegar a una página específica
   */
  goToPage(page: number): void {
    if (
      this.disabled ||
      page === this._currentPage() ||
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    const event: PageChangeEvent = {
      page,
      itemsPerPage: this._itemsPerPage(),
      totalItems: this._totalItems(),
      totalPages: this.totalPages(),
    };

    this.pageChange.emit(event);
  }

  /**
   * Ir a la primera página
   */
  goToFirstPage(): void {
    this.goToPage(1);
  }

  /**
   * Ir a la página anterior
   */
  goToPreviousPage(): void {
    this.goToPage(this._currentPage() - 1);
  }

  /**
   * Ir a la página siguiente
   */
  goToNextPage(): void {
    this.goToPage(this._currentPage() + 1);
  }

  /**
   * Ir a la última página
   */
  goToLastPage(): void {
    this.goToPage(this.totalPages());
  }

  /**
   * Cambiar el tamaño de página
   */
  onPageSizeChange(newPageSize: number): void {
    if (this.disabled || newPageSize === this._itemsPerPage()) {
      return;
    }

    // Calcular nueva página para mantener contexto
    const currentFirstItem =
      (this._currentPage() - 1) * this._itemsPerPage() + 1;
    const newPage = Math.ceil(currentFirstItem / newPageSize);

    const event: PageSizeChangeEvent = {
      pageSize: newPageSize,
      currentPage: newPage,
      totalItems: this._totalItems(),
      totalPages: Math.ceil(this._totalItems() / newPageSize),
    };

    this.pageSizeChange.emit(event);
  }

  /**
   * Función trackBy para optimizar renderizado
   */
  trackByPage(index: number, page: number): number {
    return page;
  }

  /**
   * Función trackBy para opciones de tamaño de página
   */
  trackByPageSize(index: number, size: number): number {
    return size;
  }
}
