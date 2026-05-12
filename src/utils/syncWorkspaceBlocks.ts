import type { FileItem, Idea, Note, ProjectWorkspaceBlock, Task } from '../types'

type SyncLinkedEntityParams =
  | { entityType: 'task'; entity: Task; blocks: ProjectWorkspaceBlock[] }
  | { entityType: 'note'; entity: Note; blocks: ProjectWorkspaceBlock[] }
  | { entityType: 'idea'; entity: Idea; blocks: ProjectWorkspaceBlock[] }
  | { entityType: 'file'; entity: FileItem; blocks: ProjectWorkspaceBlock[] }

function updateMatchingBlocks(
  blocks: ProjectWorkspaceBlock[],
  entityType: ProjectWorkspaceBlock['linkedItemType'],
  entityId: string,
  updater: (block: ProjectWorkspaceBlock) => ProjectWorkspaceBlock,
) {
  let hasChanges = false

  const nextBlocks = blocks.map((block) => {
    if (block.linkedItemType !== entityType || block.linkedItemId !== entityId) {
      return block
    }

    hasChanges = true
    return updater(block)
  })

  return hasChanges ? nextBlocks : blocks
}

export function syncWorkspaceBlocksFromLinkedEntity(params: SyncLinkedEntityParams) {
  switch (params.entityType) {
    case 'task':
      return updateMatchingBlocks(params.blocks, 'task', params.entity.id, (block) => ({
        ...block,
        title: params.entity.title,
        content: params.entity.description,
        description: params.entity.description,
        tags: params.entity.tags ?? [],
        updatedAt: params.entity.updatedAt,
      }))
    case 'note':
      return updateMatchingBlocks(params.blocks, 'note', params.entity.id, (block) => ({
        ...block,
        title: params.entity.title,
        content: params.entity.content,
        description: params.entity.summary,
        tags: params.entity.tags ?? [],
        updatedAt: params.entity.updatedAt,
      }))
    case 'idea':
      return updateMatchingBlocks(params.blocks, 'idea', params.entity.id, (block) => ({
        ...block,
        title: params.entity.title,
        content: params.entity.description,
        description: params.entity.description,
        tags: params.entity.tags ?? [],
        updatedAt: params.entity.updatedAt,
      }))
    case 'file':
      return updateMatchingBlocks(params.blocks, 'file', params.entity.id, (block) => ({
        ...block,
        title: params.entity.title,
        description: params.entity.description,
        tags: params.entity.tags ?? [],
        updatedAt: params.entity.updatedAt,
      }))
  }
}

export function detachWorkspaceBlocksFromLinkedEntity(
  blocks: ProjectWorkspaceBlock[],
  entityType: Exclude<ProjectWorkspaceBlock['linkedItemType'], undefined>,
  entityId: string,
  updatedAt = new Date().toISOString(),
) {
  return updateMatchingBlocks(blocks, entityType, entityId, (block) => ({
    ...block,
    linkedItemType: undefined,
    linkedItemId: undefined,
    updatedAt,
  }))
}
