import { MailtrapClient } from 'mailtrap'
import { env } from '../../config/env'

export class AuthEmailService {
  private readonly transport = new MailtrapClient({
    token: env.MAILTRAP_TOKEN,
  })

  async sendPasswordResetMail(data: { email: string; resetUrl: string }) {
    await this.transport.send({
      from: {
        email: 'hello@demomailtrap.co',
        name: 'DUCKS GameClub',
      },
      to: [{ email: data.email }],
      subject: 'Восстановление пароля DUCKS GameClub',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>Восстановление пароля</h2>
          <p>Мы получили запрос на смену пароля для вашего аккаунта DUCKS GameClub.</p>
          <p>
            <a href="${data.resetUrl}" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Сменить пароль
            </a>
          </p>
          <p>Ссылка действует 30 минут. Если вы не запрашивали смену пароля, просто проигнорируйте это письмо.</p>
        </div>
      `,
      category: 'password-reset',
    })
  }
}
