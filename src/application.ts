import express from 'express';
import ormConfig from './mikro-orm.config';
import bodyParser from 'body-parser';
import cors from 'cors';

import { Connection, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { GraphQLSchema } from 'graphql';
import expressPlayground from 'graphql-playground-middleware-express';
import { Server } from 'http';
import { buildSchema } from 'type-graphql';
import { MyContext } from './types';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';

import RedisStore from "connect-redis"
import Session from "express-session"
import { createClient } from "redis"
import { __prod__ } from './constants';
export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public host: express.Application;
  public server: Server;

  public connect = async (): Promise<void> => {
    try {
      this.orm = await MikroORM.init(ormConfig);
      const migrator = this.orm.getMigrator();
      const migrations = await migrator.getPendingMigrations();
      if (migrations && migrations.length > 0) {
        await migrator.up();
      }
    } catch (error: any) {
      console.error('📌 Could not connect to the database', error);
      throw Error(error);
    }

  };

  public init = async (): Promise<void> => {



    this.host = express();

    try {



      const client = createClient();

      await client.connect();


      // @ts-ignore: Unreachable code error
      let redisStore = new RedisStore({
        // @ts-ignore: Unreachable code error
        client: client,
        prefix: "myapp:",
        disableTouch: true,
      })

      this.host.use(
        Session({
          store: redisStore,
          resave: false, // required: force lightweight session keep alive (touch)
          saveUninitialized: false, // recommended: only save session when data exists
          secret: "keyboard cat",
          cookie:{
           maxAge: 1000 * 60 * 60 * 24 * 2,  //2 days
           httpOnly: true,
           sameSite: 'lax',
           secure: __prod__
          }
        }),
      )
    } catch (err) {
      console.error(err);
    }
    console.log(process.env.NODE_ENV)
    if (process.env.NODE_ENV !== 'production') {
      this.host.get('/graphql', expressPlayground({ endpoint: '/graphql' }));
    }

    this.host.use(cors());

    try {
      const graphqlHTTP = require('express-graphql').graphqlHTTP;
      const schema: GraphQLSchema = await buildSchema({
        resolvers: [HelloResolver, PostResolver, UserResolver],
        dateScalarMode: 'isoDate',
      });

      this.host.post(
        '/graphql',
        bodyParser.json(),
        // @ts-ignore: Unreachable code error
        graphqlHTTP((req, res) => ({
          schema,
          context: { req, res, em: this.orm.em.fork() } as MyContext,
          customFormatErrorFn: (error: Error) => {
            throw error;
          },
        })),
      );


      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.host.use((error: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): void => {
        console.error('📌 Something went wrong', error);
        res.status(400).send(error);
      });


      const port = process.env.PORT ?? 4000;
      this.server = this.host.listen(port, () => {
        console.log(`🚀 http://localhost:${port}/graphql`);
      });
    } catch (error) {
      console.error('📌 Could not start server', error);
    }
  };
}