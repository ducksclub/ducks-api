type WarmupMessageContext = {
  nearestEvent?: {
    title: string
    startsAt: string
    gameType?: string | null
  } | null
  botLink: string
}

type WarmupTouch = {
  step: number
  delayMs: number
  buildMessage: (context: WarmupMessageContext) => string
}

// const hour = 60 * 60 * 1000
// const day = 24 * hour
const minute = 60 * 1000

function getNearestEventText(context: WarmupMessageContext) {
  if (!context.nearestEvent) {
    return ''
  }

  return `\n\n📆 Ближайший турнир: ${context.nearestEvent.startsAt} — ${context.nearestEvent.title}`
}

export const abandonedRegistrationTouches: WarmupTouch[] = [
  {
    step: 1,
    // delayMs: hour,
    delayMs: minute,
    buildMessage: ({ botLink }) => {
      return [
        `🍒 Кстати, на турнир по развлекательному покеру в DUCK'S можно прийти совсем без опыта игры.`,
        ``,
        `Дилер объяснит правила примерно за 10 минут прямо за столом.`,
        `По механике это реально не сложнее, чем UNO 🙂`,
        ``,
        `Посмотреть расписание и выбрать турнир:`,
        botLink,
      ].join('\n')
    },
  },
  {
    step: 2,
    // delayMs: day,
    delayMs: 2 * minute,
    buildMessage: (context) => {
      return [
        `🥥 Иногда бывает так, что человек приходит играть впервые на турнир Bounty Sniper, вообще без опыта — и при этом выбивает 8 соперников 💪`,
        ``,
        `Знаем на собственном опыте: это вполне реально, когда нет денежного давления и можно просто получать удовольствие от игры.`,
        getNearestEventText(context),
        ``,
        `Записаться можно здесь:`,
        context.botLink,
      ].join('\n')
    },
  },
  {
    step: 3,
    // delayMs: 3 * day,
    delayMs: 3 * minute,
    buildMessage: (context) => {
      return [
        `😍 Посмотри, как выглядит обычный вечер в DUCK'S:`,
        ``,
        `турнир по покеру, рядом дартс, бильярд, бар и живое дружеское общение.`,
        ``,
        `Ярко, эмоционально и незабываемо.`,
        getNearestEventText(context),
        ``,
        `Записаться можно здесь:`,
        context.botLink,
      ].join('\n')
    },
  },
  {
    step: 4,
    // delayMs: 7 * day,
    delayMs: 4 * minute,
    buildMessage: ({ botLink }) => {
      return [
        `С каждым турниром в DUCK'S появляется человек, который потом не пропускает почти ни одного события в клубе.`,
        ``,
        `Просто потому, что попал в атмосферу и нашёл здесь свою стаю.`,
        ``,
        `Может, это будешь ты? 🙂`,
        ``,
        `Записаться на ближайший турнир:`,
        botLink,
      ].join('\n')
    },
  },
]
