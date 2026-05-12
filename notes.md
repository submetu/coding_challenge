# Coding Challenge Notes

## Task 1 — PolygonAreaJob

Created `PolygonAreaJob.ts` and registered it in `JobFactory.ts` under the `polygonArea` task type. It uses `@turf/area` to calculate the area of a polygon from the task's `geoJson` field and returns the result in square meters.

### Notes:

- The README mentions saving the result to an `output` field on the task, but there is no such field. Results are saved in a separate `results` table (`Result` entity) and linked back to the task via `task.resultId`. `TaskRunner` handles this automatically after `job.run()` returns.

### Fixes:

1. **Invalid GeoJSON validation** (`PolygonAreaJob.ts`): Added a check after `JSON.parse` to make sure the geometry is actually a `Polygon` or `MultiPolygon`. If not, it throws an error which causes the task to be marked `failed`. Before this, `@turf/area` would silently return `0` for bad input and the task would still pass.

2. **Workflow stuck in `in_progress` on task failure** (`taskRunner.ts`): Removed `throw error` from the catch block. The rethrow was skipping the workflow status update code at the bottom of the function, so even when a task failed, the workflow never got marked `failed`.
