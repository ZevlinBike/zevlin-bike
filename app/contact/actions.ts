"use server";

import { z } from "zod";
import { sendTransactionalEmail } from "@/lib/brevo";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  honeypot: z.string().optional(),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
    honeypot?: string[];
  };
};

export async function sendContactMessage(
  prevState: ContactFormState,
  formData: FormData,
) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    honeypot: formData.get("honeypot"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, subject, message, honeypot } = parsed.data;

  if (honeypot) {
    // This is a bot, do not send the email
    return {
      success: true,
      message: "Message sent successfully!",
    };
  }

  const htmlContent = `
    <h1>New Contact Message</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  try {
    // Send to all admin users
    const supabase = await createClient();
    // 1) Find admin role id
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('Error fetching admin role:', roleError);
    } else {
      // 2) Find users with that role
      const { data: adminUserIds, error: userRolesError } = await supabase
        .from('user_roles')
        .select('customer_id')
        .eq('role_id', adminRole.id);

      if (userRolesError) {
        console.error('Error fetching admin user IDs:', userRolesError);
      } else if (adminUserIds && adminUserIds.length > 0) {
        const adminIds = adminUserIds.map((ur) => ur.customer_id);
        // 3) Get their emails
        const { data: adminUsers, error: adminError } = await supabase
          .from('customers')
          .select('email, first_name, last_name')
          .in('id', adminIds);

        if (adminError) {
          console.error('Error fetching admin users:', adminError);
        } else if (adminUsers) {
          const sendSubject = subject || 'New Contact Form Submission';
          for (const admin of adminUsers) {
            if (admin.email) {
              await sendTransactionalEmail(
                { email: admin.email, name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() },
                sendSubject,
                htmlContent
              );
            }
          }
        }
      }
    }

    return { success: true, message: 'Message sent successfully!' };
  } catch (error) {
    console.error('Error sending contact emails to admins:', error);
    return {
      success: false,
      message: 'Failed to send message. Please try again later.',
    };
  }
}
