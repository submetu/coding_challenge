export type JobOutcome =
| { success: true; data: string }
| { success: false; error: string };