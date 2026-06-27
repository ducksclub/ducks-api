export function getPasswordResetEmailHtml(resetUrl: string) {
  return `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        <title>Восстановление пароля DUCK’S</title>

        <style>
          :root {
            color-scheme: dark light;
            supported-color-schemes: dark light;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #08090f !important;
            color: #ffffff !important;
          }

          .email-body,
          .email-wrapper {
            background: #08090f !important;
            color: #ffffff !important;
          }

          .email-card {
            background: #14151c !important;
            border-color: #252733 !important;
          }

          .email-logo,
          .email-button {
            background: #e91515 !important;
            color: #ffffff !important;
          }

          .email-title {
            color: #ffffff !important;
          }

          .email-text {
            color: #a1a1aa !important;
          }

          .email-muted {
            color: #71717a !important;
          }

          .email-footer {
            color: #52525b !important;
          }

          .email-footer-muted {
            color: #3f3f46 !important;
          }

          .email-divider {
            background: #252733 !important;
          }

          @media (prefers-color-scheme: light) {
            html,
            body,
            .email-body,
            .email-wrapper {
              background: #f3f4f6 !important;
              color: #111827 !important;
            }

            .email-card {
              background: #ffffff !important;
              border-color: #e5e7eb !important;
            }

            .email-logo,
            .email-button {
              background: #e91515 !important;
              color: #ffffff !important;
            }

            .email-title {
              color: #111827 !important;
            }

            .email-text {
              color: #4b5563 !important;
            }

            .email-muted {
              color: #6b7280 !important;
            }

            .email-footer {
              color: #6b7280 !important;
            }

            .email-footer-muted {
              color: #9ca3af !important;
            }

            .email-divider {
              background: #e5e7eb !important;
            }
          }

          @media (prefers-color-scheme: dark) {
            html,
            body,
            .email-body,
            .email-wrapper {
              background: #08090f !important;
              color: #ffffff !important;
            }

            .email-card {
              background: #14151c !important;
              border-color: #252733 !important;
            }

            .email-logo,
            .email-button {
              background: #e91515 !important;
              color: #ffffff !important;
            }

            .email-title {
              color: #ffffff !important;
            }

            .email-text {
              color: #a1a1aa !important;
            }

            .email-muted {
              color: #71717a !important;
            }

            .email-footer {
              color: #52525b !important;
            }

            .email-footer-muted {
              color: #3f3f46 !important;
            }

            .email-divider {
              background: #252733 !important;
            }
          }
        </style>
      </head>

      <body
        class="email-body"
        bgcolor="#08090f"
        style="
          margin: 0;
          padding: 0;
          background: #08090f;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          class="email-wrapper"
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          bgcolor="#08090f"
          style="
            width: 100%;
            background: #08090f;
            padding: 40px 16px;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width: 480px;
                  width: 100%;
                  font-family: Arial, Helvetica, sans-serif;
                "
              >
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <div
                      class="email-logo"
                      style="
                        display: inline-block;
                        padding: 8px 16px;
                        background: #e91515;
                        color: #ffffff;
                        font-size: 38px;
                        line-height: 1;
                        font-weight: 900;
                        letter-spacing: -0.02em;
                        text-transform: uppercase;
                        font-family: Arial Black, Impact, Arial, Helvetica, sans-serif;
                      "
                    >
                      DUCK’S
                    </div>

                    <div
                      class="email-text"
                      style="
                        margin-top: 12px;
                        color: #a1a1aa;
                        font-size: 12px;
                        font-weight: 700;
                        letter-spacing: 0.34em;
                        text-transform: uppercase;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Игровой клуб
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    class="email-card"
                    bgcolor="#14151c"
                    style="
                      background: #14151c;
                      border: 1px solid #252733;
                      border-radius: 22px;
                      padding: 30px 24px;
                      font-family: Arial, Helvetica, sans-serif;
                    "
                  >
                    <h1
                      class="email-title"
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 24px;
                        line-height: 1.25;
                        font-weight: 900;
                        text-align: center;
                        text-transform: uppercase;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Восстановление пароля
                    </h1>

                    <p
                      class="email-text"
                      style="
                        margin: 18px 0 0;
                        color: #a1a1aa;
                        font-size: 15px;
                        line-height: 1.6;
                        font-weight: 500;
                        text-align: center;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Мы получили запрос на смену пароля для вашего аккаунта DUCK’S GameClub.
                    </p>

                    <div
                      class="email-divider"
                      style="
                        width: 100%;
                        height: 1px;
                        margin: 24px 0;
                        background: #252733;
                        line-height: 1px;
                        font-size: 1px;
                      "
                    >
                      &nbsp;
                    </div>

                    <p
                      class="email-text"
                      style="
                        margin: 0;
                        color: #a1a1aa;
                        font-size: 15px;
                        line-height: 1.6;
                        font-weight: 500;
                        text-align: center;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Нажмите на кнопку ниже, чтобы задать новый пароль.
                    </p>

                    <a
                      class="email-button"
                      href="${resetUrl}"
                      style="
                        display: block;
                        margin-top: 24px;
                        padding: 16px 20px;
                        border-radius: 16px;
                        background: #e91515;
                        color: #ffffff;
                        text-align: center;
                        text-decoration: none;
                        font-size: 15px;
                        line-height: 1;
                        font-weight: 900;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Сменить пароль
                    </a>

                    <p
                      class="email-muted"
                      style="
                        margin: 22px 0 0;
                        color: #71717a;
                        font-size: 13px;
                        line-height: 1.6;
                        font-weight: 500;
                        text-align: center;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Ссылка действует 30 минут. Если вы не запрашивали смену пароля,
                      просто проигнорируйте это письмо.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 22px;">
                    <p
                      class="email-footer"
                      style="
                        margin: 0;
                        color: #52525b;
                        font-size: 12px;
                        line-height: 1.5;
                        font-weight: 500;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      © DUCK’S GameClub
                    </p>

                    <p
                      class="email-footer-muted"
                      style="
                        margin: 6px 0 0;
                        color: #3f3f46;
                        font-size: 12px;
                        line-height: 1.5;
                        font-weight: 500;
                        font-family: Arial, Helvetica, sans-serif;
                      "
                    >
                      Это автоматическое письмо.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
