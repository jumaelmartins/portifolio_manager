"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ListControlsConfig, ListControlsResult } from "./types";

export const DEFAULT_PAGE_SIZE = 10;

type ControlState = {
  query: string;
  sortKey: string;
  page: number;
  extras: Record<string, string>;
};

function readState(
  searchParams: URLSearchParams,
  sortKeys: string[],
  defaultSortKey: string,
  extraParamKeys: string[],
): ControlState {
  const rawSort = searchParams.get("sort");
  const rawPage = Number(searchParams.get("page"));
  const extras: Record<string, string> = {};
  for (const key of extraParamKeys) {
    const value = searchParams.get(key);
    if (value) extras[key] = value;
  }
  return {
    query: searchParams.get("q") ?? "",
    sortKey: rawSort && sortKeys.includes(rawSort) ? rawSort : defaultSortKey,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    extras,
  };
}

export function useListControls<T>(
  config: ListControlsConfig<T>,
): ListControlsResult<T> {
  const {
    items,
    basePath,
    searchAccessor,
    sorts,
    pageSize = DEFAULT_PAGE_SIZE,
    predicate,
    extraParamKeys = [],
  } = config;

  const router = useRouter();
  const searchParams = useSearchParams();
  const sortKeys = sorts.map((sort) => sort.key);
  const defaultSortKey = sorts[0].key;

  const [state, setState] = useState<ControlState>(() =>
    readState(searchParams, sortKeys, defaultSortKey, extraParamKeys),
  );

  function getParam(key: string): string | null {
    return state.extras[key] ?? null;
  }

  function writeUrl(next: ControlState) {
    const params = new URLSearchParams();
    const query = next.query.trim();
    if (query) params.set("q", query);
    if (next.sortKey !== defaultSortKey) params.set("sort", next.sortKey);
    if (next.page > 1) params.set("page", String(next.page));
    for (const key of extraParamKeys) {
      const value = next.extras[key];
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function update(partial: Partial<ControlState>, resetPage: boolean) {
    const next: ControlState = {
      ...state,
      ...partial,
      page: resetPage ? 1 : partial.page ?? state.page,
    };
    setState(next);
    writeUrl(next);
  }

  function setQuery(value: string) {
    update({ query: value }, true);
  }

  function setSortKey(key: string) {
    update({ sortKey: key }, true);
  }

  function setParam(key: string, value: string | null) {
    const extras = { ...state.extras };
    if (value === null || value === "") {
      delete extras[key];
    } else {
      extras[key] = value;
    }
    update({ extras }, true);
  }

  function goToPage(page: number) {
    update({ page }, false);
  }

  function reset() {
    update({ query: "", sortKey: defaultSortKey, extras: {}, page: 1 }, true);
  }

  const activeSort =
    sorts.find((sort) => sort.key === state.sortKey) ?? sorts[0];
  const needle = state.query.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
    const matchesQuery =
      needle === "" ||
      searchAccessor(item).toLocaleLowerCase().includes(needle);
    if (!matchesQuery) return false;
    if (predicate && !predicate(item, { getParam })) return false;
    return true;
  });
  const sorted = [...filtered].sort(activeSort.compare);
  const sortedItems = [...items].sort(activeSort.compare);
  const totalFiltered = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const rangeStart = totalFiltered === 0 ? 0 : start + 1;
  const rangeEnd = start + pageItems.length;

  return {
    pageItems,
    sortedItems,
    totalFiltered,
    totalAll: items.length,
    rangeStart,
    rangeEnd,
    page,
    pageCount,
    query: state.query,
    setQuery,
    sortKey: state.sortKey,
    setSortKey,
    getParam,
    setParam,
    goToPage,
    reset,
  };
}
