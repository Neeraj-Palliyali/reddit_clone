import { MikroORM, RequiredEntityData } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

const main = async () => {

    const orm = await MikroORM.init(
        microConfig
    );
    await orm.getMigrator().up();
    const fork = orm.em.fork();
    const post = fork.create(Post, { title: "My first Post" } as RequiredEntityData<Post>);
    await fork.persistAndFlush(post);
}


main().catch((err) => {
    console.error(err)
});