import { EntityManager } from 'typeorm';
import { Task } from '../models/Task';
import { Result } from '../models/Result';
import { TaskStatus } from '../workers/enums';

export async function aggregateWorkflowResults(
    workflowId: string,
    entityManager: EntityManager,
    excludeTaskId?: string
): Promise<object> {
    const taskRepository = entityManager.getRepository(Task);
    const resultRepository = entityManager.getRepository(Result);

    const allTasks = await taskRepository.find({
        where: { workflow: { workflowId } }
    });

    const tasks = excludeTaskId
        ? allTasks.filter(t => t.taskId !== excludeTaskId)
        : allTasks;

    const taskSummaries = await Promise.all(tasks.map(async t => {
        if (t.status === TaskStatus.Completed && t.resultId) {
            const result = await resultRepository.findOne({ where: { resultId: t.resultId } });
            let output = null;
            if (result?.data) {
                try { output = JSON.parse(result.data); } catch { output = result.data; }
            }
            return { taskId: t.taskId, type: t.taskType, output };
        }
        return { taskId: t.taskId, type: t.taskType, output: null, error: t.progress ?? 'Task failed' };
    }));

    return {
        workflowId,
        tasks: taskSummaries,
        finalReport: 'Aggregated data and results'
    };
}
