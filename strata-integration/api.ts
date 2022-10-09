import { preload as swrPreload, Key } from 'swr';

import { AccessToken, AuthToken } from 'types';
import { getOneStrataWebUrl } from './url';

export class ProblemDetailsError extends Error {
  constructor(
    public title: string,
    public detail: string | null,
    public status: string,
    public errors: Record<string, []> | string[] | null,
    public invalidProperty?: string | undefined
  ) {
    super(title);
  }
}

export class AuthenticationError extends Error {
  constructor(public status: number) {
    super();
  }
}

const isLocal = window.location.hostname === 'localhost';

const requestInitDefault: RequestInit = {
  mode: isLocal ? 'cors' : 'same-origin',
  credentials: 'omit',
  cache: 'no-store'
};

const getResponseBody = <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response as unknown as Promise<T>;
  }

  return getError(response);
};

const getJson = <T>(response: Response): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) {
      return response.text() as unknown as Promise<T>;
    }
    return response.json();
  }

  return getError(response);
};

const getError = async (response: Response): Promise<never> => {
  const contentType = response.headers.get('Content-Type');
  if (
    contentType?.includes('application/json') ||
    contentType?.includes('application/problem+json')
  ) {
    const error = await response.json();
    return Promise.reject(error);
  }

  return Promise.reject(response);
};

async function call<T>(
  resource: RequestInfo,
  responseFormatter: (response: Response) => Promise<T>,
  init: RequestInit
): Promise<T> {
  const response = await fetch(resource, init);
  return responseFormatter(response);
}

export let { accessToken } = window.mm.userProfile;
let authPromise: undefined | Promise<AccessToken>;

export function refreshToken(): AccessToken | Promise<AccessToken> {
  if (authPromise === undefined) {
    authPromise = authenticate();
    authPromise.finally(() => {
      authPromise = undefined;
    });
  }
  return authPromise;
}

function getToken(): AccessToken | Promise<AccessToken> {
  if (new Date(accessToken.expiresAt).getTime() < Date.now()) {
    return refreshToken();
  }

  return accessToken;
}

async function authenticate(): Promise<AccessToken> {
  const options: RequestInit = {
    method: 'POST',
    ...requestInitDefault,
    credentials: 'same-origin'
  };

  const token = await call<AuthToken>(
    getOneStrataWebUrl('api/authenticate'),
    getJson,
    options
  );
  accessToken = {
    token: token.token,
    expiresAt: new Date(Date.now() + token.expireInSeconds * 1000).toISOString()
  };
  return accessToken;
}

export const api = async <T>(
  resource: RequestInfo,
  options?: RequestInit,
  responseFormatter?: (response: Response) => Promise<T>,
  captureError?: boolean,
  defaultContentType?: boolean
): Promise<T> => {
  try {
    const token = await getToken();
    const contentType = defaultContentType
      ? undefined
      : { 'Content-Type': 'application/json;charset=UTF-8' };
    const init: RequestInit = {
      headers: {
        ...contentType,
        Authorization: `Bearer ${token.token}`
      },
      ...requestInitDefault,
      ...options
    };

    // for backwards compatibility, `responseFormatter` was made optional, so revert to default i.e. `getJson`
    return await call<T>(resource, responseFormatter ?? getJson, init);
  } catch (error) {
    // this can be different if the api controller returns pascal case...normalize?

    if (captureError || error.Message || error.message) {
      window.sendLogs(error?.message, error?.stack);
      throw error;
    }

    if (error.Error) {
      window.sendLogs(error.Error?.message, error.Error?.stack);
      throw error.Error;
    }

    if (error.title) {
      window.sendLogs(error.title, error.detail);
      throw new ProblemDetailsError(
        error.title,
        error.detail,
        error.status,
        error.errors,
        error.InvalidProperties?.[0]
      );
    }

    if (error.status === 401) {
      throw new AuthenticationError(error.status);
    }

    throw new Error(
      `Unhandled API Exception: ${error.status} ${error.statusText}`
    );
  }
};

api.getResponseBody = (resource: RequestInfo, options?: RequestInit) =>
  api(resource, options, getResponseBody);

api.get = <T>(
  resource: RequestInfo,
  signal?: AbortSignal,
  captureError?: boolean
) => api<T>(resource, { signal }, undefined, captureError);

api.post = <T>(
  resource: RequestInfo,
  body: unknown,
  signal?: AbortSignal,
  responseFormatter?: (response: Response) => Promise<T>,
  captureError?: boolean
) =>
  api<T>(
    resource,
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal
    },
    responseFormatter,
    captureError
  );

api.postFormData = <T>(
  resource: RequestInfo,
  body: FormData,
  signal?: AbortSignal,
  responseFormatter?: (response: Response) => Promise<T>,
  captureError?: boolean
) =>
  api<T>(
    resource,
    {
      method: 'POST',
      body,
      signal
    },
    responseFormatter,
    captureError,
    true
  );

api.put = <T>(resource: RequestInfo, body?: unknown, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'PUT',
    body: JSON.stringify(body),
    signal
  });

api.putFormData = <T>(
  resource: RequestInfo,
  body: FormData,
  signal?: AbortSignal
) =>
  api<T>(
    resource,
    {
      method: 'PUT',
      body,
      signal
    },
    undefined,
    undefined,
    true
  );

api.patch = <T>(
  resource: RequestInfo,
  body: unknown,
  responseFormatter?: (response: Response) => Promise<T>,
  signal?: AbortSignal
) =>
  api<T>(
    resource,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      signal
    },
    responseFormatter
  );

api.delete = <T>(resource: RequestInfo, body?: unknown, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'DELETE',
    body: body == null ? undefined : JSON.stringify(body),
    signal
  });

api.upload = <T>(resource: RequestInfo, body: FormData, signal?: AbortSignal) =>
  api<T>(
    resource,
    {
      method: 'POST',
      body,
      signal
    },
    undefined,
    undefined,
    true
  );

export function preload(key: Key) {
  return swrPreload(key, api);
}
