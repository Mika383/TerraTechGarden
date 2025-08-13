import { useEffect, useState } from "react";

export function useMembershipFlag() {
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);

  const readFromStorage = () => {
    const v = localStorage.getItem("hasMembership");
    setHasMembership(v === "1");
  };

  useEffect(() => {
    readFromStorage();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "hasMembership") readFromStorage();
    };

    const onCustom = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (typeof detail?.hasMembership === "boolean") {
          setHasMembership(detail.hasMembership);
        } else {
          readFromStorage();
        }
      } catch {
        readFromStorage();
      }
    };

    const onTokenRefreshed = () => readFromStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener("membershipChanged", onCustom as any);
    window.addEventListener("tokenRefreshed", onTokenRefreshed);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("membershipChanged", onCustom as any);
      window.removeEventListener("tokenRefreshed", onTokenRefreshed);
    };
  }, []);

  return hasMembership;
}
