import { MailtrapTransport } from 'mailtrap'
import { env } from '../../config/env'

export class ContactService {
  private transport = new MailtrapTransport({
    token: env.MAILTRAP_TOKEN,
  })

  async sendContactMail(data: { name: string; phone: string; city: string }) {
    await this.transport.sendMail({
      from: {
        address: 'hello@demomailtrap.co',
        name: 'DUCKS GameClub',
      },
      to: [env.ADMIN_EMAIL],
      subject: 'Новая заявка с сайта DUCKS',
      html: `
        <div style="font-family: sans-serif;">
          <h2>🦆 Новая заявка DUCKS GameClub</h2>

          <p><b>Имя:</b> ${data.name}</p>
          <p><b>Телефон:</b> ${data.phone}</p>
          <p><b>Город:</b> ${data.city}</p>
        </div>
      `,
      category: 'contact-form',
    })
  }
}
