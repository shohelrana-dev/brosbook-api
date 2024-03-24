import { IsPasswordValid, IsUsernameAlreadyExist, MatchValue } from '@utils/customValidation'
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsPhoneNumber,
    IsStrongPassword,
    MaxLength,
    MinLength,
    Validate,
} from 'class-validator'

export class ChangeUsernameDTO {
    @Validate(IsPasswordValid)
    @IsNotEmpty({ message: 'Please enter your password' })
    password: string

    @Validate(IsUsernameAlreadyExist)
    @MaxLength(20, { message: 'Username must be less than 20 characters' })
    @MinLength(5, { message: 'Username must be more than 5 characters' })
    @IsNotEmpty({ message: 'Please enter a new username' })
    username: string
}

export class ChangePasswordDTO {
    @Validate(IsPasswordValid)
    @IsNotEmpty({ message: 'Please enter your current password' })
    currentPassword: string

    @IsStrongPassword(
        {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        },
        {
            message:
                'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol',
        }
    )
    @MaxLength(20, { message: 'Password must be less than 20 characters' })
    @MinLength(8, { message: 'Password must be minimum 8 characters' })
    @IsNotEmpty({ message: 'Please enter a new password' })
    newPassword: string

    @Validate(MatchValue, ['newPassword'], {
        message: 'Confirm new password and new password must be same',
    })
    @IsNotEmpty({ message: 'Please confirm your new password' })
    confirmNewPassword: string
}

export class UpdateProfileDTO {
    @MaxLength(20, { message: 'Username must be less than 20 characters' })
    @IsNotEmpty({ message: 'Please enter your first name' })
    firstName: string

    @MaxLength(20, { message: 'Username must be less than 20 characters' })
    @IsNotEmpty({ message: 'Please enter your last name' })
    lastName: string

    @MaxLength(2000, { message: 'Username must be less than 2000 characters' })
    @MinLength(10, { message: 'Username must be more than 10 characters' })
    @IsNotEmpty({ message: 'Please enter your bio' })
    bio: string

    @IsPhoneNumber('BD')
    @IsNotEmpty({ message: 'Please enter your phone number' })
    phone: string

    @IsNotEmpty({ message: 'Please enter your current address' })
    location: string

    @IsDateString(undefined, { message: 'Please enter a valid date' })
    @IsNotEmpty({ message: 'Please enter your birthdate' })
    birthdate: string

    @IsEnum(['male', 'female'], { message: 'Invalid gender value' })
    @IsNotEmpty({ message: 'Please select your gender' })
    gender: string
}
