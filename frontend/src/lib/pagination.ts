export function parsePagination(searchParams: URLSearchParams, defaults = { page: 1, limit: 10 }) {
  const page = Math.max(1, Number(searchParams.get('page') ?? defaults.page));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? defaults.limit)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
