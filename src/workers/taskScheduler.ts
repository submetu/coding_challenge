import { Task } from '../models/Task';
import { TaskStatus } from './enums';

// Must unblock on Failed too — otherwise a failed dependency deadlocks the workflow.
// TODO: detect circular dependencies at workflow creation time (e.g. topological sort in
// WorkflowFactory.resolveDependencies) — currently cycles cause permanent silent deadlock.
export function isReadyToRun(task: Task): boolean {
    if (task.dependsOn?.length) {
        return task.dependsOn.every(
            dependency => [TaskStatus.Completed, TaskStatus.Failed].includes(dependency.status)
        );
    }
    return true;
}
