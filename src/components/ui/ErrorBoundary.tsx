import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-5xl text-error/60 mb-4 block">error</span>
            <h2 className="text-lg font-headline font-bold text-on-surface mb-2">Something went wrong</h2>
            <p className="text-sm text-on-surface-variant/60 mb-6">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-6 py-2.5 rounded-xl bg-primary-fixed-dim/15 text-primary-fixed-dim text-sm font-label font-semibold hover:bg-primary-fixed-dim/25 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
