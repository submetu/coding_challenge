import { Task } from "../models/Task";
import { EntityManager } from "typeorm";

export interface Job {
    run(task: Task, entityManager: EntityManager): Promise<any>;
}