import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {IMessageClient, GridMessage, Utils, ISession, IGridUser, IJobInfo} from 'grid-client-core';

export interface IJobsContentProps {
    msgClient: IMessageClient<GridMessage>;
    session: ISession;
    currentUser: IGridUser;
}

export interface IJobsContentState {
    sub_id?:string;
    jobs?: IJobInfo[];
}

export class JobsContent extends React.Component<IJobsContentProps, IJobsContentState> {
    constructor(props:IJobsContentProps) {
        super(props);
        this.state = {sub_id: null, jobs:null};
    }
    protected get msgClient(): IMessageClient<GridMessage> {return this.props.msgClient;}
    protected get session(): ISession {return this.props.session;}
    protected handleMessages(gMsg: GridMessage) : void {
        if (gMsg.type === 'tracking-changed') {
            //console.log('receive <<tracking-changed>');
            this.getMostRecentJobs();
        }     
    }
    private getMostRecentJobs() : void {
        this.session.getMostRecentJobs()
        .then((jobInfos: IJobInfo[]) => {
            this.setState({
                jobs: jobInfos
            });
        }).catch((err: any) => {
            console.error('!!! Error getting most recent jobs');
        });
    }
    componentDidMount() {
        console.log('JobsContent.componentDidMount()');
        this.getMostRecentJobs();
        this.msgClient.subscribe(Utils.getJobsTrackingTopic(), this.handleMessages.bind(this), {})
        .then((sub_id: string) => {
            console.log('topic subscribed sub_id=' + sub_id + " :-)");
            this.setState({sub_id});
        }).catch((err: any) => {
            console.error('!!! Error: topic subscription failed');
        });
    }
    componentWillUnmount() {
        console.log('JobsContent.componentWillUnmount()');
        if (this.state.sub_id) {
            let sub_id = this.state.sub_id;
            this.msgClient.unsubscribe(sub_id)
            .then(() => {
                console.log('successfully unsubscribed subscription ' + sub_id);
            }).catch((err:any) => {
                console.error('!!! Error unsubscribing subscription ' + sub_id);
            });
        }
    }
    private geUtilizationString(used:number, total: number, showPercent:boolean=true) : string {
        if (!total)
            return "0/0" + (showPercent ? "=0.00%" : "");
        else
            return used.toString() + "/" + total.toString() + (showPercent ? "=" + (used/total*100.0).toFixed(2) + "%" : "");
    }
    private isCompleteStatus(status:string) : boolean {
        return (status === 'FINISHED' || status === 'ABORTED');
    }
    private canKillJob(index: number):boolean {
        let jobInfo = this.state.jobs[index];
        return ((jobInfo.userId === this.props.currentUser.userId || this.props.currentUser.profile.canKillOtherUsersJob) && !this.isCompleteStatus(jobInfo.status));
    }
    private canSubmitJob():boolean {
        return this.props.currentUser.profile.canSubmitJob;
    }
    private getKillJobClickHandler(index: number) : (e:any) => void {
        return ((e:any):void => {
            let jobInfo = this.state.jobs[index];
            let jobId=jobInfo.jobId;
            this.session.killJob(jobId)
            .then(() => {

            }).catch((err: any) => {
                console.error('!!! Error killing job: ' + JSON.stringify(err));
            });
        });
    }
    private getReSubmitJobClickHandler(index: number, failedTasksOnly: boolean) : (e:any) => void {
        return ((e:any):void => {
            let jobInfo = this.state.jobs[index];
            let jobId=jobInfo.jobId;
            this.session.reSumbitJob(jobId, failedTasksOnly)
            .then(() => {

            }).catch((err:any) => {
                console.error('!!! Error re-sumbitJob job: ' + JSON.stringify(err));
            });
        });
    }

    private getJobsRows() : any {
        let actionsCellStyle = {whiteSpace: 'nowrap'};
        let reSubmitButtonStyle = {marginLeft: '2px'};
        if (this.state.jobs && this.state.jobs.length > 0) {
            return this.state.jobs.map((jobInfo: IJobInfo, index:number) => {
                return (
                    <tr key={index}>
                        <td>{jobInfo.jobId}</td>
                        <td>{jobInfo.cookie}</td>
                        <td>{jobInfo.description}</td>
                        <td>{jobInfo.userName}</td>
                        <td>{jobInfo.priority}</td>
                        <td>{jobInfo.submitTime}</td>
                        <td>{jobInfo.status}</td>
                        <td>{this.geUtilizationString(jobInfo.numTasksFinished, jobInfo.numTasks, true)}</td>
                        <td>{(this.isCompleteStatus(jobInfo.status) ? (jobInfo.success ? 'Success': 'Failed') : '')}</td>
                        <td style={actionsCellStyle}>
                            <button disabled={!this.canKillJob(index)} onClick={this.getKillJobClickHandler(index)}>Kill</button>
                            <button style={reSubmitButtonStyle} disabled={!this.canSubmitJob()} onClick={this.getReSubmitJobClickHandler(index, false)}>Re-submit</button>
                            <button style={reSubmitButtonStyle} disabled={!this.canSubmitJob() || jobInfo.success} onClick={this.getReSubmitJobClickHandler(index, true)}>Re-submit Failed</button>
                        </td>
                    </tr>
                );
            });
        } else {
            return (
                <tr>
                    <td>(None)</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            );
        }
    }
    render() {
        return (
            <div>
                <div className="w3-row">
                    <div className="w3-col">
                        <div className="w3-card-4 w3-margin">
                            <div className="w3-container w3-blue">
                                <h6>Recent Jobs</h6>
                            </div>
                            <div className="w3-container w3-white">
                                <table className="w3-table w3-bordered w3-small">
                                    <thead>
                                        <tr>
                                            <th>Job Id</th>
                                            <th>Cookie</th>
                                            <th>Description</th>
                                            <th>User Name</th>
                                            <th>Priority</th>
                                            <th>Submit Time</th>
                                            <th>Status</th>
                                            <th>Completion</th>
                                            <th>Success</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{this.getJobsRows()}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}