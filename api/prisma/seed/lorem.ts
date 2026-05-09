/** 20 palavras clássicas do lorem ipsum (todas distintas). */
const LOREM_IPSUM_DICTIONARY = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'eiusmod',
  'tempor',
  'incididunt',
  'labore',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'minim',
  'veniam',
  'quis',
] as const

function buildLoremIpsumBulk(wordCount: number): string {
  const dict = LOREM_IPSUM_DICTIONARY
  const dictLen = dict.length
  let lastIndex = -1
  const words: string[] = []
  for (let w = 0; w < wordCount; w += 1) {
    let idx = Math.floor(Math.random() * dictLen)
    while (idx === lastIndex) {
      idx = Math.floor(Math.random() * dictLen)
    }
    lastIndex = idx
    words.push(dict[idx])
  }
  return words.join(' ')
}

export function buildSeedJobDescription(tenantName: string, title: string): string {
  const intro = `Vaga na ${tenantName}: ${title}. Stack moderna, time colaborativo.\n\n`
  const wordCount = 4000 + Math.floor(Math.random() * 2001)
  return intro + buildLoremIpsumBulk(wordCount)
}
