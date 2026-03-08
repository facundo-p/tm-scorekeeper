const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

export function tryFormatDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : value
}
