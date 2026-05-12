import type { Idea, ProjectActivity, ProjectGoal, ProjectMilestone, ProjectWorkspaceBlock, Task } from '../types'

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function calculateGoalProgress(goal: ProjectGoal, tasks: Task[]) {
  if (goal.taskIds.length === 0) {
    return clampProgress(goal.progress)
  }

  const linkedTasks = tasks.filter((task) => goal.taskIds.includes(task.id))

  if (linkedTasks.length === 0) {
    return clampProgress(goal.progress)
  }

  const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
  return clampProgress((completedTasks / linkedTasks.length) * 100)
}

export function calculateMilestoneProgress(milestone: ProjectMilestone, tasks: Task[]) {
  if (milestone.taskIds.length === 0) {
    return milestone.status === 'completed' ? 100 : 0
  }

  const linkedTasks = tasks.filter((task) => milestone.taskIds.includes(task.id))

  if (linkedTasks.length === 0) {
    return milestone.status === 'completed' ? 100 : 0
  }

  const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
  return clampProgress((completedTasks / linkedTasks.length) * 100)
}

export function calculateProjectProgress(projectId: string, tasks: Task[], goals: ProjectGoal[], milestones: ProjectMilestone[]) {
  const projectTasks = tasks.filter((task) => task.projectId === projectId)
  const projectGoals = goals.filter((goal) => goal.projectId === projectId)
  const projectMilestones = milestones.filter((milestone) => milestone.projectId === projectId)

  if (projectGoals.length > 0) {
    const total = projectGoals.reduce((sum, goal) => sum + calculateGoalProgress(goal, projectTasks), 0)
    return clampProgress(total / projectGoals.length)
  }

  if (projectTasks.length > 0) {
    const completed = projectTasks.filter((task) => task.status === 'completed').length
    return clampProgress((completed / projectTasks.length) * 100)
  }

  if (projectMilestones.length > 0) {
    const completed = projectMilestones.filter((milestone) => calculateMilestoneProgress(milestone, projectTasks) >= 100 || milestone.status === 'completed').length
    return clampProgress((completed / projectMilestones.length) * 100)
  }

  return 0
}

export function getProjectStats(
  projectId: string,
  data: {
    tasks: Task[]
    goals: ProjectGoal[]
    milestones: ProjectMilestone[]
    notesCount: number
    ideas: Idea[]
    filesCount: number
    workspaceBlocks: ProjectWorkspaceBlock[]
    activities: ProjectActivity[]
  },
) {
  const projectTasks = data.tasks.filter((task) => task.projectId === projectId)
  const overdueTasks = projectTasks.filter((task) => task.deadline && task.status !== 'completed' && new Date(task.deadline).getTime() < Date.now()).length
  const completedTasks = projectTasks.filter((task) => task.status === 'completed').length
  const activeTasks = projectTasks.filter((task) => task.status !== 'completed').length
  const projectGoals = data.goals.filter((goal) => goal.projectId === projectId)
  const completedGoals = projectGoals.filter((goal) => calculateGoalProgress(goal, projectTasks) >= 100 || goal.status === 'completed').length
  const projectMilestones = data.milestones.filter((milestone) => milestone.projectId === projectId)
  const completedMilestones = projectMilestones.filter((milestone) => calculateMilestoneProgress(milestone, projectTasks) >= 100 || milestone.status === 'completed').length
  const projectIdeas = data.ideas.filter((idea) => idea.projectId === projectId)
  const recentActivityCount = data.activities.filter((activity) => activity.projectId === projectId).length
  const blocksCount = data.workspaceBlocks.filter((block) => block.projectId === projectId).length

  return {
    tasksTotal: projectTasks.length,
    tasksCompleted: completedTasks,
    tasksActive: activeTasks,
    tasksOverdue: overdueTasks,
    goalsTotal: projectGoals.length,
    goalsCompleted: completedGoals,
    milestonesTotal: projectMilestones.length,
    milestonesCompleted: completedMilestones,
    notesTotal: data.notesCount,
    ideasTotal: projectIdeas.length,
    filesTotal: data.filesCount,
    workspaceBlocksTotal: blocksCount,
    activityTotal: recentActivityCount,
  }
}