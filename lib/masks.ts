export function maskDocument(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 14)
  const n = d.length
  if (n <= 11) {
    if (n <= 3) return d
    if (n <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (n <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }
  if (n <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  const n = d.length
  if (n <= 2) return d.length ? `(${d}` : ''
  if (n <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (n <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
