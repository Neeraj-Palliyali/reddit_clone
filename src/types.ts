import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"
import { Request } from "express";
import { Session, SessionData } from "express-session";
export interface ExtendedRequest extends Request {
	session: Session &
		Partial<SessionData> &
		Express.Request & { userId: number };
}

export type MyContext = {
    req: ExtendedRequest;
    res: Response;
    em: EntityManager<IDatabaseDriver<Connection>>;
}