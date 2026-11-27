/** Une clases ignorando los valores falsos (equivale a `cls` del mockup). */
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')
