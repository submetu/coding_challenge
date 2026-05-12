import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { TaskStatus } from './enums';

export async function isReadyToRun(task: Task, taskRepository: Repository<Task>): Promise<boolean> {
    // report always runs after all other tasks reach a terminal state
    if (task.taskType === 'report') {
        if (!task.workflow) throw new Error('isReadyToRun: task.workflow must be loaded before calling this function');
        const allTasks = await taskRepository.find({
            where: { workflow: { workflowId: task.workflow.workflowId } }
        });
        return allTasks
            .filter(t => t.taskId !== task.taskId)
            .every(t => t.status === TaskStatus.Completed || t.status === TaskStatus.Failed);
    }
    // Task 3: dependsOn checks will be added here
    return true;
}
