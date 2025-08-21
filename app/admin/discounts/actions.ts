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
  const { data, error } = await supabase.from('discounts').insert([
    {
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      active: formData.get('active') === 'on',
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
  const { data, error } = await supabase
    .from('discounts')
    .update({
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      active: formData.get('active') === 'on',
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
