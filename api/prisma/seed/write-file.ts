import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { MockDataFile } from './mock-data.types'

export function getMockDataJsonPath(): string {
  return join(process.cwd(), 'prisma', 'seed', 'mock-data.json')
}

export async function writeMockDataFile(mockData: MockDataFile): Promise<string> {
  const filePath = getMockDataJsonPath()
  await writeFile(filePath, `${JSON.stringify(mockData, null, 2)}\n`, 'utf8')
  return filePath
}
