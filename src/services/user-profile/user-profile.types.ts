export type Profile = {
    username: string
    name: string
    email: string
    phoneNumber: string
}

export type ProfileUpdate = Partial<Profile>
