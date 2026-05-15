import { Task } from '../models/Task';
import { TaskStatus } from './enums';

export async function isReadyToRun(task: Task): Promise<boolean> {
    if (task.dependsOn?.length) {
        return task.dependsOn.every(
            dependency => [TaskStatus.Completed, TaskStatus.Failed].includes(dependency.status)
        );
    }
    return true;
}
