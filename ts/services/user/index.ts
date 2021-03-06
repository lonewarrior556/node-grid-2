import * as express from 'express';
import * as core from 'express-serve-static-core';
import {IGridUser} from 'grid-client-core';

let router = express.Router();

function getUser(req: express.Request): IGridUser {
    let user:IGridUser = req["user"];
    return user;
}

router.get('/me', (req: express.Request, res: express.Response) => {
    res.jsonp(getUser(req));
});

export {router as Router}; 