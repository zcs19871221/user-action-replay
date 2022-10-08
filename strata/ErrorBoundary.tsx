import { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { H1, P, Button } from '@strata/one-strata-ui';
import { css } from '@linaria/core';

import { ReauthenticateModal } from './ReauthenticateModal';
import { terminology, AuthenticationError } from 'utils';

const containerClassname = css`
  margin: var(--circle-spacing-x2);
`;

interface State {
  readonly error: Error | null;
  readonly href: string | null;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  State
> {
  readonly state: State = {
    error: null,
    href: null
  };

  componentDidMount() {
    // @ts-expect-error
    window.navigation?.addEventListener(
      'navigate',
      this.resetStateAfterNavigation
    );
  }

  componentWillUnmount() {
    // @ts-expect-error
    window.navigation?.removeEventListener(
      'navigate',
      this.resetStateAfterNavigation
    );
  }

  static getDerivedStateFromError(error: Error) {
    // we cannot rely on `useLocation` as it doesn't work outside a `Router`
    window.sendLogs(error.message, error.stack);
    return { error, href: window.location.href };
  }

  private resetStateAfterNavigation = () => {
    // We must wait for react to render the next page before resetting,
    // otherwise react-router will render the previous page's tree, which will crash again,
    // so ErrorBoundary in the next page will remain in a crashed state.
    // This rAF workaround might no be needed once react-router adopts the Navigation API.
    requestAnimationFrame(() => {
      if (this.state.error === null) return;
      this.resetState();
    });
  };

  private resetState() {
    this.setState({ error: null, href: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (
      // @ts-expect-error
      window.navigation === undefined &&
      this.state.href !== window.location.href
    ) {
      // TODO: remove once we can use the the Navigation API on all browsers https://chromestatus.com/feature/6232287446302720
      this.resetState();
    }

    if (this.state.error instanceof AuthenticationError) {
      return <ReauthenticateModal />;
    }

    return (
      <div className={containerClassname}>
        <H1>
          <FormattedMessage
            id="Root.ErrorBoundary.ErrorMessage"
            defaultMessage="Something went wrong"
          />
        </H1>
        <P>{this.state.error.message}</P>
        <Button onClick={() => this.resetState()}>
          <FormattedMessage {...terminology.Retry} />
        </Button>
      </div>
    );
  }
}
