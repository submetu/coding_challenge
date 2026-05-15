import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { DataSource } from 'typeorm';
import { Workflow } from '../models/Workflow';
import { Task } from '../models/Task';
import { WorkflowStatus } from './enums';
import { TaskStatus } from '../workers/enums';
import { WorkflowDefinition, WorkflowStep } from './types';

export class WorkflowFactory {
    constructor(private dataSource: DataSource) {}
    /**
     * Creates a workflow by reading a YAML file and constructing the Workflow and Task entities.
     * @param filePath - Path to the YAML file.
     * @param clientId - Client identifier for the workflow.
     * @param geoJson - The geoJson data string for tasks (customize as needed).
     * @returns A promise that resolves to the created Workflow.
     */
    async createWorkflowFromYAML(filePath: string, clientId: string, geoJson: string): Promise<Workflow> {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const workflowDef = yaml.load(fileContent) as WorkflowDefinition;
        const workflowRepository = this.dataSource.getRepository(Workflow);
        const taskRepository = this.dataSource.getRepository(Task);
        const workflow = new Workflow();

        workflow.clientId = clientId;
        workflow.status = WorkflowStatus.Initial;

        const savedWorkflow = await workflowRepository.save(workflow);

        const tasks: Task[] = workflowDef.steps.map(step => {
            const task = new Task();
            task.clientId = clientId;
            task.geoJson = geoJson;
            task.status = TaskStatus.Queued;
            task.taskType = step.taskType;
            task.stepNumber = step.stepNumber;
            task.workflow = savedWorkflow;
            return task;
        });

        const savedTasks = await taskRepository.save(tasks);

        const tasksWithDeps = this.resolveDependencies(workflowDef.steps, savedTasks);
        // Only save tasks that have dependencies (avoids unnecessary DB writes)
        if (tasksWithDeps.length > 0) {
            await taskRepository.save(tasksWithDeps);
        }

        return savedWorkflow;
    }

    /**
     * Resolves YAML dependsOn step numbers into Task entity references.
     * Returns new Task copies with dependsOn set.
     */
    private resolveDependencies(steps: WorkflowStep[], savedTasks: Task[]): Task[] {
        // Save tasks by stepNumber for O(1) lookup
        const taskByStep = new Map(savedTasks.map(task => [task.stepNumber, task]));

        return steps
            .filter(step => step.dependsOn?.length)
            .map(step => {
                const task = taskByStep.get(step.stepNumber)!;
                const dependencies = step.dependsOn!.map(depStepNumber => {
                    const depTask = taskByStep.get(depStepNumber);
                    if (!depTask) {
                        throw new Error(
                            `Step ${step.stepNumber} declares dependsOn step ${depStepNumber} which does not exist`
                        );
                    }
                    return depTask;
                });
                return Object.assign(new Task(), task, { dependsOn: dependencies });
            });
    }
}