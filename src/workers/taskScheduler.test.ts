import { isReadyToRun } from './taskScheduler';
import { Task } from '../models/Task';
import { TaskStatus } from './enums';

describe('isReadyToRun', () => {
    it('returns true when task has no dependencies', () => {
        // given
        const task = { dependsOn: [] } as unknown as Task;

        // when / then
        expect(isReadyToRun(task)).toBe(true);
    });

    it('returns true only when all dependencies are terminal', () => {
        // given
        const completed = { status: TaskStatus.Completed } as Task;
        const failed = { status: TaskStatus.Failed } as Task;
        const queued = { status: TaskStatus.Queued } as Task;

        // when / then
        expect(isReadyToRun({ dependsOn: [completed, failed] } as unknown as Task)).toBe(true);
        expect(isReadyToRun({ dependsOn: [completed, queued] } as unknown as Task)).toBe(false);
    });
});
