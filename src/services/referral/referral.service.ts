import { ClientStatus } from '../../domains/client'
import { ActivationService } from '../activation'
import { Service } from '../service'
import { ReferralEvents } from './referral.events'
import { ReferralSettings } from './referral.settings'
import { Referral, ReferralStats } from './referral.types'
import { UserManagementService } from '../users'
import { ClientManagementService } from '../clients'
import { Client } from '../clients'
import { cache } from '../../cache'
import { RegistrationService } from '../registartion'

const ReferralStatsCache = cache.createKey<ReferralStats, [username: string]>('referral-stats')

export class ReferralService extends Service<ReferralEvents> {
    private users: UserManagementService
    private clients: ClientManagementService
    private registration: RegistrationService
    private activationService: ActivationService

    constructor(
        events: ReferralEvents,
        users: UserManagementService,
        clients: ClientManagementService,
        registration: RegistrationService,
        activationService: ActivationService
    ) {
        super(events)

        this.users = users
        this.clients = clients
        this.registration = registration
        this.activationService = activationService

        this.activationService.events.onClientActivated(async clientId => {
            await this.awardReferralReward(clientId)
        })

        this.registration.events.on('userRegistered', async ({ invitor }) => {
            if (invitor) await cache.clear(ReferralStatsCache(invitor))
        })
    }

    private async toReferral(client: Client): Promise<Referral> {
        const user = await this.users.getUserByUsername(client.username)
        requireNotNull(user, `User not found for client, id; ${client.id}`)

        return {
            username: user.username,
            name: user.name,
            status: client.status,
            joinedOn: user.joinedOn
        }
    }

    async getReferralReward(): Promise<number> {
        return await ReferralSettings.inviteReward.get()
    }

    async getStats(clientId: number): Promise<ReferralStats | null> {
        const client = await this.clients.getClient(clientId)
        if (!client) return null

        return await cache.getOrElse(ReferralStatsCache(client.username), async () => {
            const [total, active, inactive] = await Promise.all([
                await this.clients.getReferralCount(clientId),
                await this.clients.getReferralCount(clientId, {
                    status: { eq: ClientStatus.Active }
                }),
                await this.clients.getReferralCount(clientId, {
                    status: { eq: ClientStatus.Inactive }
                })
            ])

            const referralReward = await ReferralSettings.inviteReward.get()
            // TODO: This calculation is wrong if the referral reward is changed at any point
            //  implement Transactions to keep track of earnings
            const earnings = active * referralReward

            return { total, active, inactive, earnings }
        })
    }

    async getReferralsCount(clientId: number, filters?: Filters<Referral>): Promise<number> {
        return await this.clients.getReferralCount(clientId, { status: filters?.status })
    }

    async getReferrals(
        clientId: number,
        filters?: Filters<Referral>,
        options?: { offset?: number; limit?: number }
    ): Promise<Referral[]> {
        const clients = await this.clients.getInvitees(
            clientId,
            { status: filters?.status },
            options
        )

        return Promise.all(clients.map(client => this.toReferral(client)))
    }

    async awardReferralReward(clientId: number): Promise<Result<void>> {
        const client = await this.clients.getClient(clientId)
        if (!client) return Result.error('AccountNotFound')

        if (client.status !== ClientStatus.Active) return Result.error('ClientNotActive')

        const invitor = await this.clients.getInvitor(clientId)
        if (!invitor) return Result.ok()

        const referralReward = await this.getReferralReward()

        const [_, error] = await this.clients.incrementBalance(invitor.id, referralReward)
        if (error) {
            console.log(error)
            // TODO: Report this for manual handling
            return Result.error(
                'RewardReferralFailed',
                `Failed to award KES ${referralReward} to client(id: ${invitor.id}) for ` +
                    `inviting client(id: ${clientId})`
            )
        }

        await cache.clear(ReferralStatsCache(invitor.username))

        return Result.ok()
    }
}
