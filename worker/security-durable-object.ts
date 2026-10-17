import { DurableObject } from 'cloudflare:workers'
import type { WorkerEnv } from './types'

type SlidingWindow = { timestamps: number[] }

/**
 * Stores short-lived abuse counters and login-alert cooldowns outside individual
 * Worker isolates. Keys are HMAC digests, never raw visitor IP addresses.
 */
export class SecurityDurableObject extends DurableObject<WorkerEnv> {
  async consume(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<SlidingWindow>(`rate:${key}`)
      const timestamps = (stored?.timestamps ?? []).filter((timestamp) => timestamp > now - windowMs)
      if (timestamps.length >= limit) return false
      timestamps.push(now)
      await this.ctx.storage.put(`rate:${key}`, { timestamps })
      return true
    })
  }

  async shouldNotifyAdminLogin(username: string, cooldownMs: number, now = Date.now()): Promise<boolean> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `admin-login:${username}`
      const lastNotificationAt = await this.ctx.storage.get<number>(key)
      if (typeof lastNotificationAt === 'number' && now - lastNotificationAt < cooldownMs) return false
      await this.ctx.storage.put(key, now)
      return true
    })
  }
}
