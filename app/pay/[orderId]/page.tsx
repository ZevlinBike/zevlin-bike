import PayClientPage from "./PayClientPage";

type SearchParams = { [k: string]: string | string[] | undefined };

export default async function Page({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<SearchParams> }) {
  const { orderId } = await params;
  const sp = await searchParams;
  const cs = typeof sp.cs === 'string' ? sp.cs : '';
  if (!cs) {
    return null;
  }
  return <PayClientPage clientSecret={cs} invoiceId={orderId} />;
}
