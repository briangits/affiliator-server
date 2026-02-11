export type User = {
    id: number
    name: string
    username: string
    email: string
    phoneNumber: string
    joinedOn: Date
    password: string
}

export type NewUser = Pick<User, 'username' | 'name' | 'email' | 'phoneNumber' | 'password'>
export type UserUpdate = Partial<Pick<User, 'username' | 'name' | 'email' | 'phoneNumber'>>
