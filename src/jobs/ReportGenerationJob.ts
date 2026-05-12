import { Job } from './Job';
import { Task } from '../models/Task';
import { EntityManager } from 'typeorm';
import { aggregateWorkflowResults } from '../utils/aggregateWorkflowResults';

export class ReportGenerationJob implements Job {
    async run(task: Task, entityManager: EntityManager): Promise<object> {
        console.log(`Generating report for task ${task.taskId}...`);
        return aggregateWorkflowResults(task.workflow.workflowId, entityManager, task.taskId);
    }
}
