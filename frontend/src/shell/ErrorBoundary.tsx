import { Component, type ReactNode } from 'react'
import { ErrorState } from '@/ui/states'

interface Props {
  /** Cambia con la ruta: al navegar se vuelve a intentar. */
  resetKey: string
  children: ReactNode
}

interface State {
  failed: boolean
  key: string
}

/** Un error al dibujar una pantalla muestra el estado de error en vez de la página en blanco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, key: this.props.resetKey }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null
  }

  render() {
    if (this.state.failed) return <ErrorState onRetry={() => this.setState({ failed: false })} />
    return this.props.children
  }
}
