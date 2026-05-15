import { Job, DependencyResult } from './Job';
import { Task } from '../models/Task';

export class ReportGenerationJob implements Job {
    async run(task: Task, depResults: DependencyResult[]): Promise<object> {
        console.log(`Generating report for task ${task.taskId}...`);
        return {
            workflowId: task.workflow.workflowId,
            tasks: depResults,
            finalReport: 'Aggregated data and results'
        };
    }
}
