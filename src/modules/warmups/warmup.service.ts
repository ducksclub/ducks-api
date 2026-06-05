import type { PrismaClient } from '@prisma/client'
import { env } from '../../config/env.js'
import {
  EventStatuses,
  RegistrationStatuses,
  WarmupScenarioKeys,
  WarmupStatuses,
} from '../../common/types/domain.js'
import { abandonedRegistrationTouches } from './warmup.messages.js'

export class WarmupService {
  constructor(private readonly prisma: PrismaClient) {}

  async startAbandonedRegistrationWarmup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
      },
    })

    if (!user?.telegramId) {
      return null
    }

    const hasActiveRegistration = await this.hasActiveRegistration(userId)

    if (hasActiveRegistration) {
      return null
    }

    const firstTouch = abandonedRegistrationTouches[0]

    if (!firstTouch) {
      return null
    }

    const nextSendAt = new Date(Date.now() + firstTouch.delayMs)

    return this.prisma.userWarmup.upsert({
      where: {
        userId_scenarioKey: {
          userId,
          scenarioKey: WarmupScenarioKeys.abandonedRegistration,
        },
      },
      create: {
        userId,
        scenarioKey: WarmupScenarioKeys.abandonedRegistration,
        currentStep: 0,
        status: WarmupStatuses.active,
        nextSendAt,
      },
      update: {
        currentStep: 0,
        status: WarmupStatuses.active,
        stoppedAt: null,
        completedAt: null,
        nextSendAt,
      },
    })
  }

  async stopAbandonedRegistrationWarmup(userId: string) {
    await this.prisma.userWarmup.updateMany({
      where: {
        userId,
        scenarioKey: WarmupScenarioKeys.abandonedRegistration,
        status: WarmupStatuses.active,
      },
      data: {
        status: WarmupStatuses.stopped,
        stoppedAt: new Date(),
        nextSendAt: null,
      },
    })
  }

  async processDueWarmups() {
    const now = new Date()

    const warmups = await this.prisma.userWarmup.findMany({
      where: {
        status: WarmupStatuses.active,
        nextSendAt: {
          lte: now,
        },
      },
      include: {
        user: true,
      },
      take: 50,
      orderBy: {
        nextSendAt: 'asc',
      },
    })

    for (const warmup of warmups) {
      try {
        await this.processWarmup(warmup.id)
      } catch (error) {
        console.error('[WarmupService] Failed to process warmup', {
          warmupId: warmup.id,
          error,
        })
      }
    }
  }

  private async processWarmup(warmupId: string) {
    const warmup = await this.prisma.userWarmup.findUnique({
      where: { id: warmupId },
      include: {
        user: true,
      },
    })

    if (!warmup) return

    if (warmup.status !== WarmupStatuses.active) return

    const telegramId = warmup.user.telegramId

    if (!telegramId) {
      await this.stopWarmup(warmup.id)
      return
    }

    const hasActiveRegistration = await this.hasActiveRegistration(warmup.userId)

    if (hasActiveRegistration) {
      await this.stopWarmup(warmup.id)
      return
    }

    const nextStep = warmup.currentStep + 1

    const touch = abandonedRegistrationTouches.find((item) => item.step === nextStep)

    if (!touch) {
      await this.completeWarmup(warmup.id)
      return
    }

    const nearestEvent = await this.getNearestPublishedEvent()
    const message = touch.buildMessage({
      nearestEvent,
      botLink: env.TELEGRAM_BOT_USERNAME,
    })

    await this.sendTelegramNotification({
      telegramId,
      message,
    })

    const nextTouch = abandonedRegistrationTouches.find((item) => item.step === nextStep + 1)

    if (!nextTouch) {
      await this.completeWarmup(warmup.id, nextStep)
      return
    }

    await this.prisma.userWarmup.update({
      where: { id: warmup.id },
      data: {
        currentStep: nextStep,
        nextSendAt: new Date(Date.now() + nextTouch.delayMs),
      },
    })
  }

  private async hasActiveRegistration(userId: string) {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: {
        userId,
        status: RegistrationStatuses.registered,
        event: {
          status: EventStatuses.published,
        },
      },
      select: {
        id: true,
      },
    })

    return Boolean(registration)
  }

  private async getNearestPublishedEvent() {
    const event = await this.prisma.event.findFirst({
      where: {
        status: EventStatuses.published,
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
      select: {
        title: true,
        startsAt: true,
        gameType: true,
      },
    })

    if (!event) return null

    return {
      title: event.title,
      gameType: event.gameType,
      startsAt: this.formatMoscowDate(event.startsAt),
    }
  }

  private formatMoscowDate(date: Date) {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  private async sendTelegramNotification(payload: { telegramId: string; message: string }) {
    const res = await fetch(`${env.TELEGRAM_BOT_API_URL}/notification`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        telegramId: payload.telegramId,
        message: payload.message,
      }),
    })

    if (!res.ok) {
      const text = await res.text()

      throw new Error(`Telegram notification failed: ${res.status} ${res.statusText} ${text}`)
    }
  }

  private async stopWarmup(warmupId: string) {
    await this.prisma.userWarmup.update({
      where: { id: warmupId },
      data: {
        status: WarmupStatuses.stopped,
        stoppedAt: new Date(),
        nextSendAt: null,
      },
    })
  }

  private async completeWarmup(warmupId: string, currentStep?: number) {
    await this.prisma.userWarmup.update({
      where: { id: warmupId },
      data: {
        status: WarmupStatuses.completed,
        completedAt: new Date(),
        nextSendAt: null,
        ...(!!currentStep && { currentStep }),
      },
    })
  }
}
