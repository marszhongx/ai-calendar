import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SizableText, YStack } from 'tamagui'
import { AccentButton } from './accent-button'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$6"
          gap="$4"
        >
          <SizableText size="$8">:(</SizableText>
          <SizableText size="$4" textAlign="center" color="$color11">
            Something went wrong
          </SizableText>
          <AccentButton
            label="Retry"
            onPress={() => this.setState({ hasError: false })}
          />
        </YStack>
      )
    }
    return this.props.children
  }
}
