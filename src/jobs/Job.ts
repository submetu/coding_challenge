import { Task } from "../models/Task";

export interface DependencyResult {
    taskId: string;
    type: string;
    output: unknown;
    error?: string;
}

export interface Job {
    run(task: Task, depResults: DependencyResult[]): Promise<unknown>;
}
