import {ISession} from '../gridClient';
import {IJobProgress, IJobResult} from '../messaging';
import {TestJobs} from './testJobs';

export function run(session: ISession, done: (err:any) => void) {
    let js = TestJobs.getEchoTestJob(1000);
    //let js = TestJobs.getSleepTestJob();

    let job = session.runJob(js);
    job.on('submitted', (jobId: string) => {
        console.log('job submitted, joId=' + jobId);
    }).on('status-changed', (jp: IJobProgress) => {
        console.log(JSON.stringify(jp));
    }).on('error', (error:any) => {
        console.error('!!! Error: ' + JSON.stringify(error));
        done(error);
    }).on('done', (jp: IJobProgress) => {
        console.log('job ' + job.jobId + ' finished with status = ' + jp.status);
        session.getJobResult(job.jobId, (error:any,jobResult:IJobResult) => {
            if (error)
                console.error('!!! Error: ' + JSON.stringify(error));
            else {
                console.log('============================================================');
                //console.log(JSON.stringify(jobResult));
                console.log('============================================================');
            }
            done(error);
        });
    });
    job.run();
}