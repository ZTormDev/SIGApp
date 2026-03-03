import { useEffect, useState } from "react";
import { subscribeToOnlineCount } from "../utils/firebase";

/**
 * Hook que devuelve el número de usuarios online en tiempo real.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const onlineCount = useOnlineUsers();
 *   return <Text>{onlineCount} usuarios online</Text>;
 * }
 * ```
 */
export function useOnlineUsers(): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeToOnlineCount(setCount);
    return unsubscribe;
  }, []);

  return count;
}
