// npm install @apollo/server express graphql cors body-parser
import "reflect-metadata";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import path from "path"
import ormConfig from './mikro-orm.config';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { MikroORM } from "@mikro-orm/postgresql";
// import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import { Context } from "./types";
import { UserResolver } from "./resolvers/user";


async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);
  const orm = await MikroORM.init(ormConfig);


  async (): Promise<void> => {
    try {
      const migrator = orm.getMigrator();
      const migrations = await migrator.getPendingMigrations();
      if (migrations && migrations.length > 0) {
        await migrator.up();
      }

    } catch (error: any) {
      console.error('📌 Could not connect to the database', error);
      throw Error(error);
    }

  };

  app.use((error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    console.error('📌 Something went wrong', error);
    res.status(400).send(error);
  });

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    emitSchemaFile: path.resolve(__dirname, "schema.gql")
  })
  const server = new ApolloServer<Context>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res, }) =>
        ( { req: req, res: res, em: orm.em.fork() } as Context),
    }),
  );
  // app.listen({port:4000});
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}
bootstrap().catch(console.error);