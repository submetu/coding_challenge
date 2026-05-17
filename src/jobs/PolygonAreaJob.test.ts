import { PolygonAreaJob } from './PolygonAreaJob';
import { Task } from '../models/Task';

const job = new PolygonAreaJob();

function taskWith(geoJson: string): Task {
    return { taskId: 'test', geoJson } as Task;
}

describe('PolygonAreaJob', () => {
    it('calculates area for a valid Polygon', async () => {
        // given
        const polygon = {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        };

        // when
        const result = await job.run(taskWith(JSON.stringify(polygon)));

        // then
        expect(Number(result)).toBeGreaterThan(0);
    });

    it('throws on invalid geometry type', async () => {
        // given
        const point = { type: 'Point', coordinates: [0, 0] };

        // when / then
        await expect(job.run(taskWith(JSON.stringify(point)))).rejects.toThrow('Invalid GeoJSON');
    });
});
