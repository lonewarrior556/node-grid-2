import {IConnectionsManager} from 'rcf-message-router';
import {GridMessage, ITask} from 'grid-client-core';
import {INodeMessenger} from './dispatcher';

class NodeMessenger implements INodeMessenger {
    constructor(private nodeAppConnectionsManager: IConnectionsManager) {}
    dispatchTaskToNode(nodeId: string, task: ITask): void {
        let msg: GridMessage = {
            type: 'launch-task'
            ,content: task
        };
        this.nodeAppConnectionsManager.dispatchMessage('/topic/node/' + nodeId, {type: 'launch-task'}, msg);
    }
    killProcessesTree(nodeId: string, pids:number[]): void {
        let msg: GridMessage = {
            type: 'kill-processes-tree'
            ,content: pids
        };
        this.nodeAppConnectionsManager.dispatchMessage('/topic/node/' + nodeId, {type: 'kill-processes-tree'}, msg);
    }
}

export function get(nodeAppConnectionsManager: IConnectionsManager) : INodeMessenger {return new NodeMessenger(nodeAppConnectionsManager);}