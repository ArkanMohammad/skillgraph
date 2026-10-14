// Short readable date such as "Oct 14, 2026" (in the language of the browser)
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}