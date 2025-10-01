import { useState } from 'react';

export function useLoader() {
  const [loading, setLoading] = useState<boolean>(false);

  const wrapLoading = async (promise: Promise<any>) => {
    setLoading(true);
    try {
      await promise;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    wrapLoading,
  };
}
