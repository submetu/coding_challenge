import { AppDataSource } from '../data-source';
import { Task } from '../models/Task';
import { TaskRunner } from './taskRunner';
import { TaskStatus } from './enums';
import { isReadyToRun } from './taskScheduler';

export async function taskWorker() {
    const taskRepository = AppDataSource.getRepository(Task);
    const taskRunner = new TaskRunner(taskRepository);

    while (true) {
        const queuedTasks = await taskRepository.find({
            where: { status: TaskStatus.Queued },
            relations: ['workflow', 'dependsOn']
        });

        for (const task of queuedTasks) {
            if (await isReadyToRun(task)) {
                try {
                    await taskRunner.run(task);
                } catch (error) {
                    console.error('Task execution failed. Task status has already been updated by TaskRunner.');
                    console.error(error);
                }
                break; // one task per tick
            }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}
