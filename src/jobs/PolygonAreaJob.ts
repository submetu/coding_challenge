import { Job } from './Job';
import { Task } from '../models/Task';
import area from '@turf/area';
import { Feature, Polygon } from 'geojson';

export class PolygonAreaJob implements Job {
    async run(task: Task): Promise<string> {
        console.log(`Calculating Polygon Area for task ${task.taskId}...`);

        const input = JSON.parse(task.geoJson);
        const geometryType = input.type === 'Feature' ? input.geometry?.type : input.type;
        if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
            throw new Error(`Invalid GeoJSON: expected Polygon or MultiPolygon, got ${geometryType}`);
        }

        return area(input as Feature<Polygon>).toString();
    }
}