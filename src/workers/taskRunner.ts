import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { getJobForTaskType } from '../jobs/JobFactory';
import { DependencyResult } from '../jobs/Job';
import { Workflow } from "../models/Workflow";
import { Result } from "../models/Result";
import { WorkflowStatus } from '../workflows/enums';
import { TaskStatus } from './enums';

export class TaskRunner {
    constructor(
        private taskRepository: Repository<Task>,
    ) { }

    async run(task: Task): Promise<void> {
        task.status = TaskStatus.InProgress;
        task.progress = 'starting job...';
        await this.taskRepository.save(task);
        const job = getJobForTaskType(task.taskType);

        try {
            console.log(`Starting job ${task.taskType} for task ${task.taskId}...`);
            const resultRepository = this.taskRepository.manager.getRepository(Result);
            const dependencyResults = await this.buildDependencyResults(task);
            const taskResult = await job.run(task, dependencyResults);
            console.log(`Job ${task.taskType} for task ${task.taskId} completed successfully.`);
            const result = new Result();
            result.taskId = task.taskId!;
            result.data = JSON.stringify(taskResult || {});
            await resultRepository.save(result);
            task.resultId = result.resultId!;
            task.status = TaskStatus.Completed;
            task.progress = null;
            await this.taskRepository.save(task);

        } catch (error: unknown) {
            console.error(`Error running job ${task.taskType} for task ${task.taskId}:`, error);

            task.status = TaskStatus.Failed;
            task.progress = error instanceof Error ? error.message : 'Unknown error';
            await this.taskRepository.save(task);
        }

        const workflowRepository = this.taskRepository.manager.getRepository(Workflow);
        const currentWorkflow = await workflowRepository.findOne({ where: { workflowId: task.workflow.workflowId }, relations: ['tasks'] });

        if (currentWorkflow) {
            const allCompleted = currentWorkflow.tasks.every(t => t.status === TaskStatus.Completed);
            const anyFailed = currentWorkflow.tasks.some(t => t.status === TaskStatus.Failed);

            if (anyFailed) {
                currentWorkflow.status = WorkflowStatus.Failed;
            } else if (allCompleted) {
                currentWorkflow.status = WorkflowStatus.Completed;
            } else {
                currentWorkflow.status = WorkflowStatus.InProgress;
            }

            await workflowRepository.save(currentWorkflow);
        }
    }

    private async buildDependencyResults(task: Task): Promise<DependencyResult[]> {
        if (!task.dependsOn?.length) return [];

        const resultRepository = this.taskRepository.manager.getRepository(Result);

        return Promise.all(
            task.dependsOn.map(async dependency => {
                if (dependency.status === TaskStatus.Completed && dependency.resultId) {
                    const result = await resultRepository.findOne({ where: { resultId: dependency.resultId } });
                    let output = null;
                    if (result?.data) {
                        try {
                            output = JSON.parse(result.data);
                        } catch { 
                            output = result.data; 
                        }
                    }
                    return { taskId: dependency.taskId, type: dependency.taskType, output };
                }
                return {
                    taskId: dependency.taskId,
                    type: dependency.taskType,
                    output: null,
                    error: dependency.progress ?? 'Task failed'
                };
            })
        );
    }
}
