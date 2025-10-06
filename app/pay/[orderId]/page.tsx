import PayClientPage from "./PayClientPage";

export default async function Page(ctx: { params: Promise<{ orderId: string }>, searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const { orderId } = await ctx.params;
  const sp = await ctx.searchParams;
  const cs = typeof sp.cs === 'string' ? sp.cs : '';
  if (!cs) {
    return null;
  }
  return <PayClientPage clientSecret={cs} invoiceId={orderId} />;
}
