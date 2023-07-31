import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"
import { Request } from "express";

export type MyContext = {
    req: Request & { session: Express.SessionStore};
    res: Response;
    em: EntityManager<IDatabaseDriver<Connection>>;
}