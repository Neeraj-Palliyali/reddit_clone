import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import argon2 from "argon2";
import { UsernamePasswordInput } from "./usernamePasswordValidator";

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
}