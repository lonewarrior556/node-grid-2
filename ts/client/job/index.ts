import * as express from 'express';
import * as core from 'express-serve-static-core';
import {IGlobal} from '../../global';
import {Dispatcher} from '../../dispatcher';
import {IUser, IJobInfo} from '../../messaging';

let router = express.Router();

function getUser(req: express.Request): IUser {
    let user:IUser = req["user"];
    return user;
}

function getDispatcher(req:express.Request) : Dispatcher {
    let request: express.Request = req;
    let g:IGlobal = request.app.get('global');
    return g.dispatcher;
}

router.post('/submit', (req: express.Request, res: express.Response) => {
    let dispatcher = getDispatcher(req);
    let user = getUser(req);
    dispatcher.submitJob(user, req.body, (err: any, jobId:string) => {
        if (err)
            res.status(400).json({err});
        else
            res.json({jobId});
    }, (req.query['notificationCookie'] ? req.query['notificationCookie'] : null));
});

function canKillJob(req: express.Request, res: express.Response, next: express.NextFunction) {
    let jobInfo:IJobInfo = req['jobInfo'];
    let user = getUser(req);
    if (user.profile.canKillOtherUsersJob || user.userId === jobInfo.userId)
        next();
    else
        res.status(401).json({err: 'not authorized'});
}

let jobOperationRouter = express.Router();

jobOperationRouter.get('/kill', canKillJob, (req: express.Request, res: express.Response) => {
    let dispatcher = getDispatcher(req);
    let jobInfo:IJobInfo = req['jobInfo'];
    dispatcher.killJob(jobInfo.jobId, (err: any) => {
        if (err)
            res.status(400).json({err});
        else
            res.json({});
    });
});

jobOperationRouter.get('/info', (req: express.Request, res: express.Response) => {
    let jobInfo:IJobInfo = req['jobInfo'];
    res.json(jobInfo);
});

function getJobInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
    let jobId:string = req.params['jobId'];
    if (!jobId)
        res.status(400).json({err: 'bad job id'});
    else {
        let dispatcher = getDispatcher(req);
        dispatcher.getJobInfo(jobId, (err:any, jobInfo: IJobInfo) => {
            if (err)
                res.status(400).json({err});
            else {
                req['jobInfo'] = jobInfo;
                next();
            }
        });
    }
}

export {router as Router}; 