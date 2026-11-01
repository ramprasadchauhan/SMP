/* eslint-disable react/prop-types */
import { Component } from "react";
import { Button, Result } from "antd";

// Catches render errors so a single broken component can never blank the
// whole app. `resetKey` (e.g. the current path) clears the error on navigation.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI error boundary caught an error", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6" role="alert">
        <Result
          status="error"
          title="This page ran into a problem"
          subTitle="The error has been logged. You can try again, or go back to the dashboard."
          extra={[
            <Button key="retry" type="primary" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>,
            <Button key="home" href="/dashboard">
              Go to dashboard
            </Button>,
          ]}
        />
      </div>
    );
  }
}
