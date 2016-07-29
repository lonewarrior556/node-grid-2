import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {MsgBroker, IMessage} from 'message-broker';
import {ISession} from '../gridClient';
import {IDispatcherJSON, INodeItem, IQueueJSON, IDispControl} from '../dispatcher';
import {IGridUser, GridMessage} from '../messaging';
import {ClientMessaging} from '../clientMessaging';

export interface IHomeContentProps {
    msgBroker: MsgBroker;
    session: ISession;
    currentUser: IGridUser;
}

export interface IHomeContentState {
    sub_id?:string;
    nodes?: INodeItem[];
    queue?:IQueueJSON;
    dispControl?: IDispControl;
}

export class HomeContent extends React.Component<IHomeContentProps, IHomeContentState> {
    constructor(props:IHomeContentProps) {
        super(props);
        this.state = {sub_id: null};
    }
    get msgBroker(): MsgBroker {return this.props.msgBroker;}
    get session(): ISession {return this.props.session;}
    private getDispatcherJSON() {
        this.session.getDispatcherJSON((err: any, dispatcherJSON: IDispatcherJSON) => {
            if (err)
                console.error('!!! Error getting dispatcher state');
            else {
                this.setState({
                    nodes: dispatcherJSON.nodes
                    ,queue: dispatcherJSON.queue
                    ,dispControl: dispatcherJSON.dispControl
                });
            }            
        });
    }
    private handleDispatcherMessages(gMsg: GridMessage) : void {
        if (gMsg.type === 'ctrl-changed') {
            //console.log('receive <<ctrl-changed>');
            let dispControl: IDispControl = gMsg.content;
            this.setState({dispControl: dispControl});
        } else if (gMsg.type === 'nodes-changed') {
            //console.log('receive <<nodes-changed>>');
            let nodes: INodeItem[] = gMsg.content;
            this.setState({nodes: nodes});
        } else if (gMsg.type === 'queue-changed') {
            //console.log('receive <<queue-changed>>: ' + JSON.stringify(gMsg.content));
            let queue: IQueueJSON = gMsg.content;
            this.setState({queue: queue});
        }       
    }
    componentDidMount() {
        console.log('HomeContent.componentDidMount()');
        this.getDispatcherJSON();
        let sub_id = this.msgBroker.subscribe(ClientMessaging.getDispatcherTopic()
        ,(msg: IMessage) => {
            this.handleDispatcherMessages(msg.body);
        }
        ,{}
        ,(err: any) => {
            if (err) {
                console.error('!!! Error: topic subscription failed');
            } else {
                console.log('topic subscribed sub_id=' + sub_id + " :-)");
                this.setState({sub_id});
            }
        });

    }
    componentWillUnmount() {
        console.log('HomeContent.componentWillUnmount()');
        if (this.state.sub_id) {
            let sub_id = this.state.sub_id;
            this.msgBroker.unsubscribe(sub_id, (err:any) => {
                if (err)
                    console.error('!!! Error unsubscribing subscription ' + sub_id);
                else
                    console.log('successfully unsubscribed subscription ' + sub_id);
            });
        }
    }
    booleanString(val: boolean) : string {return (val ? "Yes": "No");}
    geUtilizationString(used:number, total: number, showPercent:boolean=true) : string {
        if (!total)
            return "0/0" + (showPercent ? "=0.00%" : "");
        else
            return used.toString() + "/" + total.toString() + (showPercent ? "=" + (used/total*100.0).toFixed(2) + "%" : "");
    }
    getGridUtilizationString() : string {
        let numUsed = 0;
        let numTotal = 0;
        if (this.state.nodes && this.state.nodes.length > 0) {
            for (let i in this.state.nodes) {
                let nodeItem:INodeItem = this.state.nodes[i];
                if (nodeItem.enabled) {
                    numUsed += nodeItem.cpusUsed;
                    numTotal += nodeItem.numCPUs;
                }
            }
        }
        return " (" + this.geUtilizationString(numUsed, numTotal, true) + ")";
    }
    getNodeEnableDisableClickHandler(index: number) : (e:any) => void {
        return ((e:any):void => {
            let nodeItem = this.state.nodes[index];
            let nodeId=nodeItem.id;
            this.session.setNodeEnabled(nodeId, !nodeItem.enabled, (err:any, nodeItem: INodeItem) => {
                if (err) {
                    console.error('!!! Error enable/disable node: ' + JSON.stringify(err));
                }
            });
        });
    }
    getNodRows() {
        if (this.state.nodes && this.state.nodes.length > 0) {
            return this.state.nodes.map((nodeItem: INodeItem, index:number) => {
                return (
                    <tr key={index}>
                        <td>{index+1}</td>
                        <td>{nodeItem.id}</td>
                        <td>{nodeItem.name}</td>
                        <td>{this.booleanString(nodeItem.enabled)}</td>
                        <td>{this.geUtilizationString(nodeItem.cpusUsed, nodeItem.numCPUs, false)}</td>
                        <td><button disabled={!this.props.currentUser.profile.canEnableDisableNode} onClick={this.getNodeEnableDisableClickHandler(index)}>{nodeItem.enabled ? "Disable" : "Enable"}</button></td>
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
                </tr>
            );
        }
    }
    onQueueCloseClick(e:any) {
        if (this.state.dispControl) {
            this.session.setQueueOpened(this.state.dispControl.queueClosed, (err:any, dispControl: IDispControl) => {
                if (err) {
                    console.error('!!! Error opening/closing queue: ' + JSON.stringify(err));
                } else {
                    this.setState({dispControl: dispControl});
                }
            });
        }
    }
    onDispatchingEnableClick(e:any) {
        if (this.state.dispControl) {
            this.session.setDispatchingEnabled(!this.state.dispControl.dispatchEnabled, (err:any, dispControl: IDispControl) => {
                if (err) {
                    console.error('!!! Unable to start/stop task dispatching: ' + JSON.stringify(err));
                } else {
                    this.setState({dispControl: dispControl});
                }
            });
        }        
    }
    render() {
        return (
            <div>
                <div className="w3-row">
                    <div className="w3-col m8">
                        <div className="w3-card-4 w3-margin">
                            <div className="w3-container w3-pale-green">
                                <h4>Nodes {this.getGridUtilizationString()}</h4>
                            </div>
                            <div className="w3-container w3-white">
                                <table className="w3-table w3-bordered">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Id</th>
                                            <th>Name</th>
                                            <th>Enabled</th>
                                            <th>Usage</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{this.getNodRows()}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="w3-col m4">
                        <div className="w3-card-4 w3-margin">
                            <div className="w3-container w3-pale-green">
                                <h4>Queue</h4>
                            </div>
                            <div className="w3-container w3-white">
                                <table className="w3-table w3-bordered">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Priorities in queue</td>
                                            <td>{this.state.queue ? this.state.queue.priorities.join(',') : " "}</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>No. job(s) in queue</td>
                                            <td>{this.state.queue ? this.state.queue.numJobs : " "}</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>No. task(s) in queue</td>
                                            <td>{this.state.queue ? this.state.queue.numTasks : " "}</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>Queue closed</td>
                                            <td>{this.state.dispControl ? this.booleanString(this.state.dispControl.queueClosed) : " "}</td>
                                            <td>
                                                <button disabled={!this.props.currentUser.profile.canOpenCloseQueue} onClick={this.onQueueCloseClick.bind(this)}>{!this.state.dispControl || this.state.dispControl.queueClosed ? "Open" : "Close"}</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Task dispatching enabled</td>
                                            <td>{this.state.dispControl ? this.booleanString(this.state.dispControl.dispatchEnabled) : " "}</td>
                                            <td>
                                                <button disabled={!this.props.currentUser.profile.canStartStopDispatching} onClick={this.onDispatchingEnableClick.bind(this)}>{!this.state.dispControl || this.state.dispControl.dispatchEnabled ? "Disable" : "Enable"}</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}