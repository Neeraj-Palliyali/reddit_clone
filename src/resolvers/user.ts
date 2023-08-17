import { User } from "../entities/User";
import { Context as MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Resolver } from "type-graphql";
import bcrypt from "bcrypt";
import { UsernamePasswordInput } from "./usernamePasswordValidator";
import { MaxLength } from "class-validator";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../constants";
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

    @Field({ nullable: true })
    token?: string;
}
@Resolver()
export class UserResolver {

    // @Query(() => User, { nullable: true })
    // async current_user(
    //     @Ctx() { req, em }: MyContext
    // ) {
    //     // if (!req.session.userId) {
    //     //     return null;
    //     // }
    //     const user = await em.findOne(User, { id: req.session.userId });
    //     return user
    // }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() ctx: MyContext
    ): Promise<UserResponse> {

        const hashedPassword = await bcrypt.hash(options.password, 10);
        const user = ctx.em.create(User, {
            username: options.username, password: hashedPassword,
        });
        try {
            await ctx.em.persistAndFlush(user);
        } catch (err) {
            if (err.code === '23505') {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already exists"
                        }
                    ]
                }
            }
            console.log("message:", err);
        }

        try {
            const token: string = jwt.sign({ data: user.id, }, JWT_SECRET, { expiresIn: "24h" });
            return { user, token };
        }
        catch (err) {

            console.log("message:", err);
            return {
                errors: [
                    {
                        field: "JWT",
                        message: "JWT cannot be generated"
                    }
                ]
            }
        };

    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {

        if (options.username.length <= 2) {
            return {
                errors: [{
                    field: 'username',
                    message: "Username too short to be valid",
                },]
            }
        }

        if (options.password.length <= 2) {
            return {
                errors: [{
                    field: 'password',
                    message: "password too short to be valid",
                },]
            }
        }
        const user = await em.findOneOrFail(User, {
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
        console.log(user.password)
        const valid = await bcrypt.compare(options.password, user.password,);
        if (!valid) {
            return {
                errors: [{
                    field: 'password',
                    message: "Wrong password",
                },]
            }
        }

        // req.session.userId = user.id;
        return { user: user };
    }
}