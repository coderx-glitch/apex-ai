export const TASK_LANES=[['todo','To do'],['doing','In progress'],['done','Done']];
export function taskLane(task){return task.done?'done':task.stage==='doing'?'doing':'todo'}
export function moveTask(task,lane){if(!TASK_LANES.some(([id])=>id===lane))throw Error('Choose a valid task lane.');return{...task,done:lane==='done',stage:lane==='doing'?'doing':'todo'}}
export function taskBoard(tasks){return TASK_LANES.map(([id,title])=>({id,title,tasks:tasks.filter(t=>taskLane(t)===id)}))}
