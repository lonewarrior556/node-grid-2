import * as React from 'react';
import {Utils, IGridAutoScalerJSON, AutoScalerImplementationInfo, IMessageClient, GridMessage, IGridAutoScaler} from 'grid-client-core';

export interface IAutoScalerProps {
    autoScalerAvailable: boolean
    gridAutoScaler: IGridAutoScaler
    msgClient: IMessageClient<GridMessage>;
}

export interface IAutoScalerState {
    sub_id?: string;
    autoScalerJSON?: IGridAutoScalerJSON;
    autoScalerImplementationInfo?: AutoScalerImplementationInfo;
}

export class AutoScalerUI extends React.Component<IAutoScalerProps, IAutoScalerState> {
    constructor(props:IAutoScalerProps) {
        super(props);
        this.state = {
            sub_id: null
            ,autoScalerJSON: null
            ,autoScalerImplementationInfo: null
        };
    }
    protected handleMessages(gMsg: GridMessage) : void {
        if (gMsg.type === 'autoscaler-changed') {
            this.getAutoScalerJSON();
        }
    }
    protected get MsgClient(): IMessageClient<GridMessage> {return this.props.msgClient;}
    protected get GridAutoScaler(): IGridAutoScaler {return this.props.gridAutoScaler;}
    private getAutoScalerJSON() {
        this.GridAutoScaler.getJSON()
        .then((autoScalerJSON: IGridAutoScalerJSON) => {
            this.setState({autoScalerJSON})
        }).catch((err: any) => {
            console.error('!!! Error getting auto-scaler json');
        });
    }
    private getAutoScalerImplementationInfo() {
        this.GridAutoScaler.getImplementationInfo()
        .then((autoScalerImplementationInfo: AutoScalerImplementationInfo) => {
            this.setState({autoScalerImplementationInfo})
        }).catch((err: any) => {
            console.error('!!! Error getting auto-scaler config url');
        });
    }

    componentDidMount() {
        console.log('HomeContent.componentDidMount()');
        if (this.props.autoScalerAvailable) {
            this.getAutoScalerJSON();
            this.getAutoScalerImplementationInfo();
            this.MsgClient.subscribe(Utils.getAutoScalerTopic(), this.handleMessages.bind(this), {})
            .then((sub_id: string) => {
                console.log('autoscaler topic subscribed, sub_id=' + sub_id + " :-)");
                this.setState({sub_id});
            }).catch((err: any) => {
                console.error('!!! Error: topic subscription failed');
            });
        }
    }
    componentWillUnmount() {
        console.log('HomeContent.componentWillUnmount()');
        if (this.state.sub_id) {
            let sub_id = this.state.sub_id;
            this.MsgClient.unsubscribe(sub_id)
            .then(() => {
                console.log('successfully unsubscribed subscription ' + sub_id);
            }).catch((err: any) => {
                console.error('!!! Error unsubscribing subscription ' + sub_id);
            });
        }
    }
    private booleanString(val: boolean) : string {return (val ? "Yes": "No");}

    private get AutoScalerAvailable(): boolean {return this.props.autoScalerAvailable};
    private get AutoScalerJSON(): IGridAutoScalerJSON {return this.state.autoScalerJSON;}
    private get AutoScalerImplInfo(): AutoScalerImplementationInfo {return this.state.autoScalerImplementationInfo;}
    // TODO: check profile
    private get AllowToChangeAutoScalerConfig() : boolean {
        if (!this.AutoScalerAvailable)
            return false;
        else if (!this.AutoScalerJSON)
            return false;
        else
            return true;
    }
    private get AutoScalerEnabledText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.booleanString(this.AutoScalerJSON.Enabled) : null) : "N/A");}
    private get AutoScalerScalingText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? (this.AutoScalerJSON.ScalingUp ? "Scaling up...": "Idle") : null) : "N/A");}
    private get AutoScalerMaxNodesText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.AutoScalerJSON.MaxWorkersCap.toString() : null) : "N/A");}
    private get AutoScalerMinNodesText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.AutoScalerJSON.MinWorkersCap.toString() : null) : "N/A");}
    private get AutoScalerNodeLaunchingTimeoutText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.AutoScalerJSON.LaunchingTimeoutMinutes.toString() + " min." : null) : "N/A");}
    private get AutoScalerTerminateWorkerAfterMinutesIdleText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.AutoScalerJSON.TerminateWorkerAfterMinutesIdle.toString() + " min." : null) : "N/A");}
    private get AutoScalerRampUpSpeedRatioText() : string {return (this.AutoScalerAvailable ? (this.AutoScalerJSON ? this.AutoScalerJSON.RampUpSpeedRatio.toString() : null) : "N/A");}
    private get AutoScalerImplName() : string {return (this.AutoScalerAvailable ? (this.AutoScalerImplInfo ? this.AutoScalerImplInfo.Name : null) : "N/A");}
    private get HasAutoScalerImplSetupUI() : boolean {return (this.AutoScalerAvailable ? (this.AutoScalerImplInfo ? this.AutoScalerImplInfo.HasSetupUI : false) : false);}
    private get AutoScalerImplSetupUILinkEnabled() : boolean {return this.AllowToChangeAutoScalerConfig && this.HasAutoScalerImplSetupUI;}
    private get AutoScalerImplSetupUIUrl() : string {return (this.HasAutoScalerImplSetupUI ? "autoscaler/implementation" : "#");}

    private onAutoScalerEnableClick(e:any) {
        if (this.state.autoScalerJSON) {
            let p = (this.state.autoScalerJSON.Enabled ? this.GridAutoScaler.disable() : this.GridAutoScaler.enable());
            p.then(() => {

            }).catch((err: any) => {
                console.error('!!! Unable to enable/disable auto-scaler: ' + JSON.stringify(err));
            });
        }
    }
    render() {
        return (
            <div className="w3-card-4 w3-margin">
                <div className="w3-container w3-blue">
                    <h6>Auto-Scaler ({this.AutoScalerAvailable ? "Available" : "N/A"})</h6>
                </div>
                <div className="w3-container w3-white">
                    <table className="w3-table w3-bordered w3-small">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Enabled</td>
                                <td>{this.AutoScalerEnabledText}</td>
                                <td><button disabled={!this.AllowToChangeAutoScalerConfig} onClick={this.onAutoScalerEnableClick.bind(this)}>{!this.state.autoScalerJSON || this.state.autoScalerJSON.Enabled ? "Disable" : "Enable"}</button></td>
                            </tr>
                            <tr>
                                <td>Scaling</td>
                                <td>{this.AutoScalerScalingText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Max. # of nodes</td>
                                <td>{this.AutoScalerMaxNodesText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Min. # of nodes</td>
                                <td>{this.AutoScalerMinNodesText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Node launching timeout</td>
                                <td>{this.AutoScalerNodeLaunchingTimeoutText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Terminate node after idle for </td>
                                <td>{this.AutoScalerTerminateWorkerAfterMinutesIdleText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Ramp up speed ratio</td>
                                <td>{this.AutoScalerRampUpSpeedRatioText}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Implementation Name</td>
                                <td>{this.AutoScalerImplName}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Additional config.</td>
                                <td></td>
                                <td><a disabled={!this.AutoScalerImplSetupUILinkEnabled} href={this.AutoScalerImplSetupUIUrl}>Click Here</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}