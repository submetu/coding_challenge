import { Repository } from 'typeorm';
import { Task } from '../models/Task';
import { Workflow } from '../models/Workflow';
import { Result } from '../models/Result';
import { getJobForTaskType } from '../jobs/JobFactory';
import { DependencyResult } from '../jobs/Job';
import { WorkflowStatus } from '../workflows/enums';
import { TaskStatus } from './enums';
import { buildTaskResults } from '../utils/buildTaskResults';
import { JobOutcome } from './types';

export class TaskRunner {
    constructor(private taskRepository: Repository<Task>) {}

    async run(task: Task): Promise<void> {
        task.status = TaskStatus.InProgress;
        task.progress = 'starting job...';
        await this.taskRepository.save(task);
        // Non-critical: if this fails, settleWorkflow will correct the status later.
        await this.markWorkflowInProgress(task);

        const outcome = await this.executeJob(task);
        try {
            await this.persistOutcome(task, outcome);
        } catch (error:unknown) {
            // Revert to Queued so the worker retries on next poll.
            // TODO: add a retry counter to avoid infinite requeue on persistent failures.
            task.status = TaskStatus.Queued;
            task.progress = null;
            await this.taskRepository.save(task);

            throw error;
        }
    }

    private async markWorkflowInProgress(task: Task): Promise<void> {
        const workflowRepo = this.taskRepository.manager.getRepository(Workflow);
        const workflow = await workflowRepo.findOne({ where: { workflowId: task.workflow.workflowId } });
        if (workflow && workflow.status === WorkflowStatus.Initial) {
            workflow.status = WorkflowStatus.InProgress;
            await workflowRepo.save(workflow);
        }
    }

    private async executeJob(task: Task): Promise<JobOutcome> {
        try {
            console.log(`Starting job ${task.taskType} for task ${task.taskId}...`);

            const job = getJobForTaskType(task.taskType);
            const dependencyResults = await this.buildDependencyResults(task);
            const taskResult = await job.run(task, dependencyResults);

            console.log(`Job ${task.taskType} for task ${task.taskId} completed successfully.`);
            return { success: true, data: JSON.stringify(taskResult || {}) };
        } catch (error: unknown) {
            console.error(`Error running job ${task.taskType} for task ${task.taskId}:`, error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private async persistOutcome(task: Task, outcome: JobOutcome): Promise<void> {
        await this.taskRepository.manager.transaction(async (manager) => {
            const taskRepo = manager.getRepository(Task);
            const workflowRepo = manager.getRepository(Workflow);
            const resultRepo = manager.getRepository(Result);

            if (outcome.success) {
                const result = new Result();
                result.taskId = task.taskId!;
                result.data = outcome.data;
                await resultRepo.save(result);
                task.resultId = result.resultId!;
                task.status = TaskStatus.Completed;
                task.progress = null;
            } else {
                task.status = TaskStatus.Failed;
                task.progress = outcome.error;
            }

            await taskRepo.save(task);
            await this.settleWorkflow(task, workflowRepo, resultRepo);
        });
    }

    private async settleWorkflow(
        task: Task,
        workflowRepo: Repository<Workflow>,
        resultRepo: Repository<Result>
    ): Promise<void> {
        const workflow = await workflowRepo.findOne({
            where: { workflowId: task.workflow.workflowId },
            relations: ['tasks']
        });
        if (!workflow) return;

        const allTerminal = workflow.tasks.every(
            task => [TaskStatus.Completed, TaskStatus.Failed].includes(task.status)
        );

        if (allTerminal) {
            const anyFailed = workflow.tasks.some(task => task.status === TaskStatus.Failed);
            workflow.status = anyFailed ? WorkflowStatus.Failed : WorkflowStatus.Completed;

            const taskResults = await buildTaskResults(workflow.tasks, resultRepo);
            workflow.finalResult = JSON.stringify({ tasks: taskResults });
        } else {
            workflow.status = WorkflowStatus.InProgress;
        }

        await workflowRepo.save(workflow);
    }

    private async buildDependencyResults(task: Task): Promise<DependencyResult[]> {
        if (!task.dependsOn?.length) return [];
        const resultRepo = this.taskRepository.manager.getRepository(Result);
        return buildTaskResults(task.dependsOn, resultRepo);
    }
}
