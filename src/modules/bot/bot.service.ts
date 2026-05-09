import { PrismaClient } from '@prisma/client'

import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'

import { EventStatuses, RegistrationStatuses } from '../../common/types/domain.js'

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
        telegram_id: telegramUserId,
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
    return this.prisma.$transaction(async (tx) => {
      /**
       * find telegram user
       */
      const user = await tx.user.findUnique({
        where: {
          telegram_id: String(telegramUserId),
        },
      })

      if (!user) {
        throw notFound('Telegram user not found')
      }

      /**
       * find event
       */
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              registrations: {
                where: {
                  status: RegistrationStatuses.active,
                },
              },
            },
          },
        },
      })

      if (!event) {
        throw notFound('Event not found')
      }

      /**
       * event validation
       */
      if (event.status !== EventStatuses.published) {
        throw badRequest('Registration is available only for published events')
      }

      /**
       * participant limit
       */
      if (event._count.registrations >= event.participantLimit) {
        throw conflict('Participant limit reached')
      }

      /**
       * existing registration
       */
      const existing = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      })

      /**
       * already active
       */
      if (existing && existing.status === RegistrationStatuses.active) {
        throw conflict('Already registered for this event')
      }

      /**
       * restore registration
       */
      if (existing) {
        return tx.eventRegistration.update({
          where: {
            id: existing.id,
          },
          data: {
            status: RegistrationStatuses.active,
            cancelledAt: null,
          },
        })
      }

      /**
       * create registration
       */
      return tx.eventRegistration.create({
        data: {
          userId: user.id,
          eventId,
          status: RegistrationStatuses.active,
        },
      })
    })
  }

  /**
   * =====================================
   * CANCEL REGISTRATION
   * =====================================
   */
  async cancelRegistration(eventId: string, telegramUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      /**
       * find telegram user
       */
      const user = await tx.user.findUnique({
        where: {
          telegram_id: String(telegramUserId),
        },
      })

      if (!user) {
        throw notFound('Telegram user not found')
      }

      /**
       * find registration
       */
      const registration = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      })

      /**
       * validation
       */
      if (!registration || registration.status !== RegistrationStatuses.active) {
        throw notFound('Active registration not found')
      }

      /**
       * cancel
       */
      return tx.eventRegistration.update({
        where: {
          id: registration.id,
        },
        data: {
          status: RegistrationStatuses.cancelled,
          cancelledAt: new Date(),
        },
      })
    })
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
          telegram_id: String(telegramUserId),
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
  //               status: RegistrationStatuses.active,
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

  //       status: RegistrationStatuses.active,
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
