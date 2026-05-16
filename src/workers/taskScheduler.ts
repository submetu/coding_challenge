import { Task } from '../models/Task';
import { TaskStatus } from './enums';

// Must unblock on Failed too — otherwise a failed dependency deadlocks the workflow.
// TODO: detect dependency cycles at workflow creation time to prevent permanent deadlocks.
export function isReadyToRun(task: Task): boolean {
    if (task.dependsOn?.length) {
        return task.dependsOn.every(
            dependency => [TaskStatus.Completed, TaskStatus.Failed].includes(dependency.status)
        );
    }
    return true;
}
