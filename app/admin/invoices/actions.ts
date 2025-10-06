"use server";

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { redirect } from "next/navigation";

function isNextRedirectError(e: unknown): e is { digest: string } {
  if (e && typeof e === 'object' && 'digest' in e) {
    const d = (e as { digest?: unknown }).digest;
    return typeof d === 'string' && d.startsWith('NEXT_REDIRECT;');
  }
  return false;
}

export async function getInvoiceShareLink(formData: FormData) {
  const id = (formData.get('invoice_id') as string | null) || '';
  if (!id) {
    redirect('/admin/invoices?error=missing_invoice_id');
  }

  try {
    const supabase = await createClient();
    const { data: inv, error } = await supabase
      .from('invoices')
      .select('id, final_total_cents, stripe_payment_intent_id')
      .eq('id', id)
      .maybeSingle();
    if (error || !inv) {
      redirect('/admin/invoices?error=invoice_not_found');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      redirect('/admin/invoices?error=stripe_not_configured');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let piId = inv.stripe_payment_intent_id as string | null;
    if (!piId) {
      const pi = await stripe.paymentIntents.create({
        amount: inv.final_total_cents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { source: 'admin_invoice', invoice_id: inv.id },
      });
      piId = pi.id;
      await supabase.from('invoices').update({ stripe_payment_intent_id: piId }).eq('id', inv.id);
      const cs = encodeURIComponent(pi.client_secret || '');
      redirect(`/admin/invoices?invoice=${inv.id}&cs=${cs}`);
    } else {
      const pi = await stripe.paymentIntents.retrieve(piId);
      const cs = encodeURIComponent(pi.client_secret || '');
      if (!cs) {
        redirect('/admin/invoices?error=missing_client_secret');
      }
      redirect(`/admin/invoices?invoice=${inv.id}&cs=${cs}`);
    }
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error('getInvoiceShareLink failed:', e);
    redirect('/admin/invoices?error=get_link_failed');
  }
}
