
import * as Brevo from '@getbrevo/brevo';
import { env } from '@/lib/env';

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

export const sendTransactionalEmail = async (
  to: { email: string; name: string },
  subject: string,
  htmlContent: string,
  sender: { email: string; name: string } = { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME }
) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.to = [to];
  sendSmtpEmail.sender = sender;
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
