/**
 * Payment gateway adapter (browser side): the hosted checkout script and the
 * global it defines. Keep in sync with src/lib/gateway.ts and the CSP in
 * next.config.ts (GATEWAY_ORIGINS).
 */
export const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const CHECKOUT_GLOBAL = "Razorpay";

type CheckoutInstance = { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
type CheckoutCtor = new (opts: Record<string, unknown>) => CheckoutInstance;

const ctor = () => (window as unknown as Record<string, CheckoutCtor | undefined>)[CHECKOUT_GLOBAL];

/** Load the hosted checkout once and return its constructor. */
export async function loadCheckout(): Promise<CheckoutCtor> {
  const existing = ctor();
  if (existing) return existing;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_SCRIPT_URL;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.head.appendChild(s);
  });
  const loaded = ctor();
  if (!loaded) throw new Error("The payment window failed to start.");
  return loaded;
}

/** Event name the checkout emits when a payment attempt fails. */
export const CHECKOUT_FAILED_EVENT = "payment.failed";
