type TaggableRecord = Record<string, unknown>

export function normalizeTag(rawTag: string): string {
  return rawTag.trim().toLowerCase().replace(/\s+/g, '_')
}

export function filterByTag<T extends TaggableRecord>(items: T[], tag: string): T[] {
  const normalizedTag = normalizeTag(tag)

  if (!normalizedTag) {
    return items
  }

  return items.filter((item) => {
    const itemTags = Array.isArray(item.tags) ? item.tags : []
    return itemTags.some((itemTag) => typeof itemTag === 'string' && normalizeTag(itemTag) === normalizedTag)
  })
}

export function getAllTags(...collections: TaggableRecord[][]): string[] {
  const tagSet = new Set<string>()

  collections.forEach((items) => {
    items.forEach((item) => {
      const itemTags = Array.isArray(item.tags) ? item.tags : []

      itemTags.forEach((tag) => {
        if (typeof tag !== 'string') {
          return
        }

        const normalizedTag = normalizeTag(tag)

        if (normalizedTag) {
          tagSet.add(normalizedTag)
        }
      })
    })
  })

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ru'))
}

export function parseTagsFromInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => normalizeTag(item))
        .filter(Boolean),
    ),
  )
}
