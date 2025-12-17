// app/admin/discounts/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getDiscounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('discounts').select('*');
  if (error) {
    console.error('Error fetching discounts:', error);
    return [];
  }
  return data;
}

export async function createDiscount(formData: FormData) {
  const supabase = await createClient();
  const productIds = formData.get('product_ids') as string;
  const { data, error } = await supabase.from('discounts').insert([
    {
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      active: formData.get('active') === 'on',
      description: formData.get('description'),
      product_ids: productIds ? productIds.split(',').map(id => id.trim()) : null,
      usage_limit: formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null,
      expiration_date: formData.get('expiration_date') ? new Date(formData.get('expiration_date') as string).toISOString() : null,
    },
  ]);

  if (error) {
    console.error('Error creating discount:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/discounts');
  return { data };
}

export async function updateDiscount(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id');
  const productIds = formData.get('product_ids') as string;
  const { data, error } = await supabase
    .from('discounts')
    .update({
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      active: formData.get('active') === 'on',
      description: formData.get('description'),
      product_ids: productIds ? productIds.split(',').map(id => id.trim()) : null,
      usage_limit: formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null,
      expiration_date: formData.get('expiration_date') ? new Date(formData.get('expiration_date') as string).toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating discount:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/discounts');
  return { data };
}

export async function deleteDiscount(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('discounts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting discount:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/discounts');
  return { data };
}

export async function updateDiscountActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('discounts')
    .update({ active })
    .eq('id', id);
  if (error) {
    console.error('Error updating discount active:', error);
    return { error: error.message };
  }
  revalidatePath('/admin/discounts');
  return { ok: true };
}

export async function updateDiscountActiveForm(formData: FormData) {
  const id = String(formData.get('id') || '');
  const active = String(formData.get('active') || '') === 'true';
  if (!id) return { error: 'Missing id' };
  return updateDiscountActive(id, active);
}
