import { notFound, redirect } from "next/navigation";
import { TestGateway } from "@/components/client";
import { currentUser } from "@/lib/auth.ts";
import { testPaymentsAllowed } from "@/lib/payments.ts";
import { planById, priceLabel } from "@/lib/plans.ts";
import { read } from "@/lib/store.ts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test payment", robots: { index: false } };

export default async function TestPay({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!testPaymentsAllowed()) notFound();
  const user = await currentUser();
  if (!user) redirect(`/login?next=/pay/test/${orderId}`);
  const order = (await read()).orders.find((o) => o.id === orderId && o.userId === user.id && o.gateway === "test");
  if (!order) notFound();
  if (order.status === "paid") redirect("/account");
  const plan = planById(order.plan)!;
  return (
    <div className="onl-container">
      <TestGateway orderId={order.id} amountLabel={priceLabel(plan)} planName={plan.name} />
    </div>
  );
}
