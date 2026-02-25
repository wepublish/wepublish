import {
  FullUserRoleFragment,
  LocalStorageKey,
  useMeQuery,
} from '@wepublish/editor/api';
import {
  createContext,
  Dispatch,
  ReactNode,
  useEffect,
  useReducer,
} from 'react';
import { usePageVisibility } from 'react-page-visibility';

export interface AuthContextState {
  readonly session?: {
    readonly email: string;
    readonly sessionToken: string;
    readonly sessionRoles?: FullUserRoleFragment[];
  } | null;
}

export const AuthContext = createContext<AuthContextState>({});

export enum AuthDispatchActionType {
  Login = 'login',
  Logout = 'logout',
}

export interface AuthDispatchLoginAction {
  readonly type: AuthDispatchActionType.Login;
  readonly payload: {
    readonly email: string;
    readonly sessionToken: string;
    readonly sessionRoles?: FullUserRoleFragment[];
  } | null;
}

export interface AuthDispatchLogoutAction {
  readonly type: AuthDispatchActionType.Logout;
}

export type AuthDispatchAction =
  | AuthDispatchLoginAction
  | AuthDispatchLogoutAction;

export const AuthDispatchContext = createContext<Dispatch<AuthDispatchAction>>(
  () => {
    throw new Error('No AuthProvider found in component tree.');
  }
);

// TODO: implement session loading state
export function authReducer(
  prevState: AuthContextState,
  action: AuthDispatchAction
): AuthContextState {
  switch (action.type) {
    case AuthDispatchActionType.Login:
      return {
        session: action.payload,
      };

    case AuthDispatchActionType.Logout:
      return { session: null };
  }
}

export interface AuthProviderProps {
  readonly children?: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data, loading, refetch, error } = useMeQuery();
  const [state, dispatch] = useReducer(authReducer, {});

  const isPageActive = usePageVisibility();

  // when it gets active, fetch the Me query again to know if user still logged in.
  useEffect(() => {
    refetch().catch(() => {
      dispatch({
        type: AuthDispatchActionType.Logout,
      });
    });
  }, [isPageActive]);

  useEffect(() => {
    if (data?.me) {
      const { email, roles } = data.me;

      dispatch({
        type: AuthDispatchActionType.Login,
        payload: {
          email,
          sessionToken: localStorage.getItem(LocalStorageKey.SessionToken)!,
          sessionRoles: roles,
        },
      });
    } else if (!loading) {
      dispatch({
        type: AuthDispatchActionType.Logout,
      });
    }
  }, [data, error, loading]);

  return loading ? null : (
      <AuthDispatchContext.Provider value={dispatch}>
        {<AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
      </AuthDispatchContext.Provider>
    );
}
