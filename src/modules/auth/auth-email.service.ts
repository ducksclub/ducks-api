import { env } from '../../config/env'
import { MailtrapClient } from 'mailtrap'
import { getPasswordResetEmailHtml } from './auth-email.templates'

export class AuthEmailService {
  private readonly transport = new MailtrapClient({
    token: env.MAILTRAP_TOKEN,
  })

  async sendPasswordResetMail(data: { email: string; resetUrl: string }) {
    await this.transport.send({
      from: {
        email: 'hello@demomailtrap.co',
        name: "DUCK'S GameClub",
      },
      to: [{ email: data.email }],
      subject: 'Восстановление пароля DUCKS GameClub',
      html: getPasswordResetEmailHtml(data.resetUrl),
      category: 'password-reset',
    })
  }
}
