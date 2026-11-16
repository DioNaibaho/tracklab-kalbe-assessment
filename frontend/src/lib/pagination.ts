export interface PagingQueryOptions {
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  operator?: "AND" | "OR";
  ignoreCase?: boolean;
  include?: Record<string, string[]>; // Contoh: { tracker_code: ["REQ-ACC", "REQ-CREATE"] }
  exclude?: Record<string, string[]>;
}

export function encodePagingFilterBase64(
  filterMap: Record<string, string[]>
): string {
  const formatted: Record<string, string> = {};
  for (const [key, values] of Object.entries(filterMap)) {
    if (values && values.length > 0) {
      formatted[key] = values.join("||");
    }
  }
  const jsonString = JSON.stringify(formatted);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(jsonString, "utf-8").toString("base64");
  }
  return btoa(jsonString);
}

export function buildKalbePagingHeaders(
  options: PagingQueryOptions = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Paging-Offset": String(options.offset ?? 0),
    "X-Paging-Limit": String(options.limit ?? 10),
    "X-Paging-SortBy": options.sortBy || "id",
    "X-Paging-SortOrder": options.sortOrder || "ASC",
  };

  if (options.search && options.search.trim() !== "") {
    headers["X-Paging-Search"] = options.search.trim();
  }

  if (options.operator) {
    headers["X-Paging-Operator"] = options.operator;
  }

  if (typeof options.ignoreCase === "boolean") {
    headers["X-Paging-IgnoreCase"] = String(options.ignoreCase);
  }

  if (options.include && Object.keys(options.include).length > 0) {
    headers["X-Paging-Include"] = encodePagingFilterBase64(options.include);
  }

  if (options.exclude && Object.keys(options.exclude).length > 0) {
    headers["X-Paging-Exclude"] = encodePagingFilterBase64(options.exclude);
  }

  return headers;
}