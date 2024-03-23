import {
    IsEmailAlreadyExist,
    IsPasswordValid,
    IsUsernameAlreadyExist,
    IsUsernameOrEmailNotExist,
    MatchValue,
} from '@utils/customValidation'
import {
    IsEmail,
    IsNotEmpty,
    IsStrongPassword,
    Length,
    Matches,
    MaxLength,
    MinLength,
    Validate,
} from 'class-validator'

export class CreateUserDTO {
    @MaxLength(20, { message: 'First name must be less than 20 characters' })
    @IsNotEmpty({ message: 'Please enter your first name' })
    firstName: string

    @MaxLength(20, { message: 'Last name must be less than 20 characters' })
    @IsNotEmpty({ message: 'Please enter your last name' })
    lastName: string

    @Validate(IsUsernameAlreadyExist)
    @Matches(/^[a-zA-Z0-9_.-]+$/, {
        message: 'Username must contain letters, numbers, underscore, dash, and dot',
    })
    @Length(5, 20, { message: 'Username must be between 5 and 20 characters' })
    @IsNotEmpty({ message: 'Please enter a username' })
    username: string

    @Validate(IsEmailAlreadyExist)
    @IsEmail(undefined, { message: 'Please enter a valid email address' })
    @IsNotEmpty({ message: 'Please enter an email' })
    email: string

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
    @MaxLength(50, { message: 'Password must be less than 50 characters' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @IsNotEmpty({ message: 'Please enter a password' })
    password: string
}

export class LoginUserDTO {
    @Validate(IsUsernameOrEmailNotExist)
    @IsNotEmpty({ message: 'Please enter your login username or email' })
    username: string

    @Validate(IsPasswordValid)
    @IsNotEmpty({ message: 'Please enter your login password' })
    password: string
}

export class ForgotPasswordDTO {
    @Validate(IsUsernameOrEmailNotExist)
    @IsEmail(undefined, { message: 'Please enter a valid email address' })
    @IsNotEmpty({ message: 'Please enter your email' })
    email: string
}

export class ResetPasswordDTO {
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
    @MaxLength(50, { message: 'Password must be less than 50 characters' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @IsNotEmpty({ message: 'Please enter a password' })
    password: string

    @Validate(MatchValue, ['password'], { message: 'Passwords do not match' })
    @IsNotEmpty({ message: 'Please confirm your password' })
    confirmPassword: string

    token: string
}
