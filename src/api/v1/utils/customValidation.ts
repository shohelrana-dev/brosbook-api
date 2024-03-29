import User from '@entities/User'
import argon2 from 'argon2'
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint({ async: true })
export class IsUsernameAlreadyExist implements ValidatorConstraintInterface {
    async validate(username: string, args: ValidationArguments) {
        try {
            await User.findOneByOrFail({ username })
            return false
        } catch (e) {
            return true
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Username already exists, please try another one'
    }
}

@ValidatorConstraint({ async: true })
export class IsEmailAlreadyExist implements ValidatorConstraintInterface {
    async validate(email: string, args: ValidationArguments) {
        try {
            await User.findOneByOrFail({ email })
            return false
        } catch (e) {
            return true
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Already have an account with the email address'
    }
}

@ValidatorConstraint({ async: true })
export class IsUsernameOrEmailNotExist implements ValidatorConstraintInterface {
    async validate(username: string, args: ValidationArguments) {
        try {
            await User.findOneOrFail({
                where: [{ username }, { email: username }],
            })
            return true
        } catch (e) {
            return false
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Account does not exist with this username or email'
    }
}

@ValidatorConstraint({ async: true })
export class MatchValue implements ValidatorConstraintInterface {
    async validate(value: string, args: ValidationArguments) {
        const [propertyName] = args.constraints
        if (value === (args.object as any)[propertyName]) {
            return true
        }
        return false
    }

    defaultMessage(args?: ValidationArguments): string {
        return `${args.targetName} must be same as ${args.constraints[0]}`
    }
}

@ValidatorConstraint({ async: true })
export class IsPasswordValid implements ValidatorConstraintInterface {
    async validate(password: string, args: ValidationArguments) {
        const { username } = args.object as any
        try {
            const user = await User.findOneOrFail({
                where: [{ username }, { email: username }],
                select: ['id', 'password'],
            })
            const isPasswordMatched = await argon2.verify(user.password, password)
            if (isPasswordMatched) {
                return true
            }
            return false
        } catch (e) {
            return false
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Password is invalid'
    }
}
