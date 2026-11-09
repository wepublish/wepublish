type CaptureRequestError<Request, Context> = (
  error: unknown,
  request: Request,
  context: Context
) => void;

const isNextClientApiError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const ownKeys = Object.keys(error);
  const { statusCode } = error as { statusCode?: unknown };

  return (
    ownKeys.length === 1 &&
    ownKeys[0] === 'statusCode' &&
    typeof statusCode === 'number' &&
    statusCode >= 400 &&
    statusCode < 500
  );
};

export const withoutClientErrors =
  <Request, Context>(
    capture: CaptureRequestError<Request, Context>
  ): CaptureRequestError<Request, Context> =>
  (error, request, context) => {
    if (isNextClientApiError(error)) {
      return;
    }

    capture(error, request, context);
  };
