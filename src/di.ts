// Simple service locator
import { ClientRepository } from './domains/client/client.repository'
import { UserRepository } from './domains/user/user.repository'
import { PaymentRepository } from './domains/payment/payment.repository'
import { ActivationRepository } from './domains/activation/activation.repository'
import { WithdrawalRepository } from './domains/withdrawal/withdrawal.repository'
import { Users } from './domains/user'
import { Clients } from './domains/client'
import { Payments } from './domains/payment'
import { Activations } from './domains/activation'
import { Withdrawals } from './domains/withdrawal'
import { AuthEvents, AuthService } from './services/auth'
import { ActivationEvents, ActivationService } from './services/activation'
import { PaymentEvents, PaymentService } from './services/payment'
import { ReferralEvents, ReferralService } from './services/referral'
import { RegistrationEvents, RegistrationService } from './services/registartion'
import { WithdrawalEvents, WithdrawalService } from './services/withdrawal'
import { UserProfileService } from './services/user-profile'
import { ClientAccountService } from './services/client-account'
import { PaystackClient } from './services/payment/gateway/paystack'
import { UserManagementService } from './services/users'
import { ClientManagementService } from './services/clients'

class DIContainer {
    private singletons = new Map<any, any>()
    private factories = new Map<any, () => any>()

    register<T>(key: any, factory: () => T): this {
        this.factories.set(key, factory)
        return this
    }

    resolve<T>(key: string): T
    resolve<T>(key: new (...args: any[]) => T): T
    resolve<T>(key: any): T {
        if (!this.singletons.has(key)) {
            const factory = this.factories.get(key)
            if (!factory) throw new Error(`No binding for ${key.name || key.toString()}`)
            this.singletons.set(key, factory())
        }
        return this.singletons.get(key) as T
    }
}

function createContainer() {
    const di = new DIContainer()

    // Repositories
    di.register(UserRepository, () => new UserRepository())
    di.register(ClientRepository, () => new ClientRepository())
    di.register(PaymentRepository, () => new PaymentRepository())
    di.register(ActivationRepository, () => new ActivationRepository())
    di.register(WithdrawalRepository, () => new WithdrawalRepository())

    // Aggregates
    di.register(Users, () => new Users(di.resolve<UserRepository>(UserRepository)))
    di.register(Clients, () => new Clients(di.resolve<ClientRepository>(ClientRepository)))
    di.register(Payments, () => new Payments(di.resolve<PaymentRepository>(PaymentRepository)))
    di.register(
        Activations,
        () => new Activations(di.resolve<ActivationRepository>(ActivationRepository))
    )
    di.register(
        Withdrawals,
        () => new Withdrawals(di.resolve<WithdrawalRepository>(WithdrawalRepository))
    )

    // Events
    di.register(AuthEvents, () => new AuthEvents())
    di.register(ActivationEvents, () => new ActivationEvents())
    di.register(PaymentEvents, () => new PaymentEvents())
    di.register(ReferralEvents, () => new ReferralEvents())
    di.register(RegistrationEvents, () => new RegistrationEvents())
    di.register(WithdrawalEvents, () => new WithdrawalEvents())

    // Services
    di.register(UserManagementService, () => new UserManagementService(di.resolve(Users)))

    di.register(
        ClientManagementService,
        () => new ClientManagementService(di.resolve(Clients), di.resolve(UserManagementService))
    )

    di.register(
        AuthService,
        () =>
            new AuthService(
                di.resolve(AuthEvents),
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService)
            )
    )

    di.register(
        RegistrationService,
        () =>
            new RegistrationService(
                di.resolve(RegistrationEvents),
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService)
            )
    )

    di.register(UserProfileService, () => new UserProfileService(di.resolve(UserManagementService)))

    di.register(
        ClientAccountService,
        () =>
            new ClientAccountService(
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService)
            )
    )

    di.register(PaystackClient, () => new PaystackClient())

    di.register(
        PaymentService,
        () =>
            new PaymentService(
                di.resolve(PaymentEvents),
                di.resolve(Payments),
                di.resolve(PaystackClient)
            )
    )

    di.register(
        ActivationService,
        () =>
            new ActivationService(
                di.resolve(ActivationEvents),
                di.resolve(Activations),
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService),
                di.resolve(PaymentService)
            )
    )

    di.register(
        ReferralService,
        () =>
            new ReferralService(
                di.resolve(ReferralEvents),
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService),
                di.resolve(RegistrationService),
                di.resolve(ActivationService)
            )
    )

    di.register(
        WithdrawalService,
        () =>
            new WithdrawalService(
                di.resolve(WithdrawalEvents),
                di.resolve(UserManagementService),
                di.resolve(ClientManagementService),
                di.resolve(Withdrawals),
                di.resolve(PaymentService)
            )
    )

    return di
}

export const DI = createContainer()
