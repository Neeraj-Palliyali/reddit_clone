import { MikroORM, } from "@mikro-orm/core";
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import express from 'express'
import microConfig from "./mikro-orm.config";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";


const main = async () => {

    const orm = await MikroORM.init<PostgreSqlDriver>(
        microConfig
    );
    const app = express();
    
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver],
            validate: false
        })
        
    })
    
    apolloServer.applyMiddleware({ app })
    await orm.getMigrator().up();
    const fork = orm.em.fork();
    app.listen(4000, () => {
        console.log("server started")
    })

    // const post = fork.create(Post, { title: "My first Post" } as RequiredEntityData<Post>);
    // await fork.persistAndFlush(post);

    // const posts = await fork.find(Post, {});
    // console.log(posts)

}


main().catch((err) => {
    console.error(err)
});