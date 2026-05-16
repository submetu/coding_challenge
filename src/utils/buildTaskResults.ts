import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { Result } from '../models/Result';
import { DependencyResult } from '../jobs/Job';
import { TaskStatus } from '../workers/enums';

export async function buildTaskResults(
    tasks: Task[],
    resultRepository: Repository<Result>
): Promise<DependencyResult[]> {
    const terminalTasks = tasks.filter(
        t => [TaskStatus.Completed, TaskStatus.Failed].includes(t.status)
    );

    return Promise.all(
        terminalTasks.map(async (task) => {
            if (task.status === TaskStatus.Completed && task.resultId) {
                const result = await resultRepository.findOne({
                    where: { resultId: task.resultId }
                });
                let output = null;
                if (result?.data) {
                    try {
                        output = JSON.parse(result.data);
                    } catch {
                        output = result.data;
                    }
                }
                return { taskId: task.taskId, type: task.taskType, output };
            }
            return {
                taskId: task.taskId,
                type: task.taskType,
                output: null,
                error: task.progress ?? 'Task failed'
            };
        })
    );
}
