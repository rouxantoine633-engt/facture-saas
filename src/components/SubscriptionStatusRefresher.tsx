"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

/**
 * Au retour de Stripe Checkout, le webhook peut arriver après la redirection
 * du navigateur : on relit le statut quelques secondes, puis on s'arrête.
 * Le composant est démonté par le serveur dès que l'abonnement est actif.
 */
export function SubscriptionStatusRefresher() {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();
      if (attempts >= MAX_ATTEMPTS) clearInterval(timer);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
