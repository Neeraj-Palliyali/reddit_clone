import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2 from "argon2";
import { UsernamePasswordInput } from "./usernamePasswordValidator";
import { MaxLength } from "class-validator";

@ObjectType()
class FieldError {

    @Field()
    @MaxLength(30)
    field: string;
    
    @Field()
    @MaxLength(300)
    message: string;
}
@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}
@Resolver()
export class UserResolver {

    @Mutation(() => User)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() ctx: MyContext
    ): Promise<User> {

        const hashedPassword = await argon2.hash(options.password);
        const user = ctx.em.create(User, {
            username: options.username, password: hashedPassword,
        });
        await ctx.em.persistAndFlush(user);
        return user;
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() ctx: MyContext
    ): Promise<UserResponse> {

        if (options.username.length <= 2){
            return {
                errors: [{
                    field: 'username',
                    message: "Username too short to be valid",
                },]
            }
        }

        if (options.password.length <= 2){
            return {
                errors: [{
                    field: 'password',
                    message: "password too short to be valid",
                },]
            }
        }
        const user = await ctx.em.findOneOrFail(User, {
            username: options.username,
        });
        
        if (!user) {
            return {
                errors: [{
                    field: 'username',
                    message: "Username does not exist",
                },]
            }
        }
        const valid = await argon2.verify(user.password, options.password);
        if (!valid) {
            return {
                errors: [{
                    field: 'password',
                    message: "Wrong password",
                },]
            }
        }

        return { user: user };
    }
}