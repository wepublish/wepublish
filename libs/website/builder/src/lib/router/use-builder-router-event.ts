import { useContext, useEffect, useRef } from 'react';

import {
  BuilderRouterContext,
  BuilderRouterEventHandler,
  BuilderRouterEventName,
} from './website-router.context';

export const useBuilderRouterEvent = <E extends BuilderRouterEventName>(
  event: E,
  handler: BuilderRouterEventHandler<E>
) => {
  const { events } = useContext(BuilderRouterContext);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener: BuilderRouterEventHandler<E> = routerEvent =>
      handlerRef.current(routerEvent);

    events.on(event, listener);

    return () => events.off(event, listener);
  }, [events, event]);
};
