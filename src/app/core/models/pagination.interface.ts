export interface PaginationConfig {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  showItemsInfo?: boolean;
  disabled?: boolean;
}

export interface PageChangeEvent {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PageSizeChangeEvent {
  pageSize: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}
