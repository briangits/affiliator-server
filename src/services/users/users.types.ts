export type User = {
    id: number
    username: string
    name: string
    email: string
    phoneNumber: string
    joinedOn: Date
}

export type NewUser = Pick<User, 'username' | 'name' | 'email' | 'phoneNumber'> & {
    password: string
}

export type UserUpdate = Partial<User>
