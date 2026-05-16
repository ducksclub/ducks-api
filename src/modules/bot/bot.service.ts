import { PrismaClient } from '@prisma/client'

import { notFound } from '../../common/errors/app-error.js'

import { EventsService } from '../events/events.service.js'

export class BotEventsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * =====================================
   * HELPERS
   * =====================================
   */

  private async getTelegramUser(telegramUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: telegramUserId,
      },
    })

    if (!user) {
      throw notFound('Telegram user not found')
    }

    return user
  }

  /**
   * =====================================
   * REGISTER USER
   * =====================================
   */

  async registerUser(eventId: string, telegramUserId: string) {
    const user = await this.getTelegramUser(String(telegramUserId))
    return new EventsService(this.prisma).registerUser(eventId, user.id)
  }

  /**
   * =====================================
   * CANCEL REGISTRATION
   * =====================================
   */
  async cancelRegistration(eventId: string, telegramUserId: string) {
    const user = await this.getTelegramUser(String(telegramUserId))
    return new EventsService(this.prisma).cancelRegistration(eventId, user.id)
  }

  /**
   * =====================================
   * GET USER REGISTRATION
   * =====================================
   */
  async getUserRegistration(telegramUserId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          telegramId: String(telegramUserId),
        },
      })

      if (!user) {
        throw notFound('Telegram user not found')
      }

      return tx.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      })
    })
  }

  /**
   * =====================================
   * LIST ACTIVE EVENTS
   * =====================================
   */

  // async listActiveNow(game?: string) {
  //   return this.prisma.event.findMany({
  //     where: {
  //       status: EventStatuses.published,

  //       ...(game
  //         ? {
  //             game: {
  //               slug: game,
  //             },
  //           }
  //         : {}),
  //     },

  //     orderBy: {
  //       startsAt: 'desc',
  //     },

  //     include: {
  //       game: true,

  //       _count: {
  //         select: {
  //           registrations: {
  //             where: {
  //               status: RegistrationStatuses.registered,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   })
  // }

  /**
   * =====================================
   * GET EVENT PARTICIPANTS
   * =====================================
   */

  // async getEventParticipants(eventId: string) {
  //   const event = await this.prisma.event.findUnique({
  //     where: {
  //       id: eventId,
  //     },

  //     include: {
  //       registrations: true,
  //     },
  //   })

  //   if (!event) {
  //     throw notFound('Event not found')
  //   }

  //   const participants = await this.prisma.eventRegistration.findMany({
  //     where: {
  //       eventId,

  //       status: RegistrationStatuses.registered,
  //     },

  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           name: true,
  //           telegram_id: true,
  //           avatarUrl: true,
  //         },
  //       },
  //     },

  //     orderBy: {
  //       position: 'asc',
  //     },
  //   })

  //   return {
  //     event,
  //     participants,
  //     total: participants.length,
  //   }
  // }

  async createFeedback(message: string, telegramUserId: string) {
    const user = await this.getTelegramUser(telegramUserId)

    return this.prisma.feedback.create({
      data: {
        message,
        ...(user.id ? { user: { connect: { id: user.id } } } : {}),
      },
    })
  }
}
