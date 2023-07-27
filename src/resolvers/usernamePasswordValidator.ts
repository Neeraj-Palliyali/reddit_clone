import { MaxLength } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UsernamePasswordInput {
    @Field()
    @MaxLength(30)
    username: string;
    
    @Field()
    @MaxLength(300)
    password: string;
}