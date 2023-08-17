import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"

export interface Context {
    req: Express.Request;
    res: Express.Response;
    em: EntityManager<IDatabaseDriver<Connection>>;
}