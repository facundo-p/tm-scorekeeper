import { Component, type ReactNode } from 'react'
import { ErrorState } from '@/ui/states'

interface Props {
  /** Cambia con la ruta: al navegar se vuelve a intentar. */
  resetKey: string
  children: ReactNode
}

interface State {
  failed: boolean
  /** Falló la descarga de un chunk diferido: React.lazy guarda el rechazo y solo recargar lo resuelve. */
  chunk: boolean
  key: string
}

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically/i

/** Un error al dibujar una pantalla muestra el estado de error en vez de la página en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, chunk: false, key: this.props.resetKey }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failed: true, chunk: error instanceof Error && CHUNK_ERROR.test(error.message) }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null
  }

  retry = () => {
    if (this.state.chunk) window.location.reload()
    else this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) return <ErrorState onRetry={this.retry} />
    return this.props.children
  }
}
