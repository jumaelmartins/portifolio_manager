export type SortOption<T> = {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
};

export type ListControlsConfig<T> = {
  items: T[];
  basePath: string;
  searchAccessor: (item: T) => string;
  sorts: SortOption<T>[];
  pageSize?: number;
  predicate?: (
    item: T,
    params: { getParam: (key: string) => string | null },
  ) => boolean;
  extraParamKeys?: string[];
};

export type ListControlsResult<T> = {
  pageItems: T[];
  totalFiltered: number;
  totalAll: number;
  rangeStart: number;
  rangeEnd: number;
  page: number;
  pageCount: number;
  query: string;
  setQuery: (value: string) => void;
  sortKey: string;
  setSortKey: (key: string) => void;
  getParam: (key: string) => string | null;
  setParam: (key: string, value: string | null) => void;
  goToPage: (page: number) => void;
  reset: () => void;
};
