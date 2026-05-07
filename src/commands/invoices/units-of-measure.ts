import { Command } from 'commander'
import { createClient } from '../../api/client.js'
import { fail, apiError } from '../../lib/error.js'

export function setup(cmd: Command) {
  cmd.option('--lang <code>', 'language for unit names (DA | EN)', 'DA')
}

export async function unitsOfMeasure(options: { lang: string }, cmd: Command) {
  const lang = options.lang.toUpperCase()
  if (lang !== 'DA' && lang !== 'EN') {
    fail(cmd, `Invalid --lang value: ${options.lang}. Must be DA or EN.`)
  }

  const client = createClient()
  const { data, error } = await client.GET('/unitsOfMeasure/{language}', {
    params: { path: { language: lang } },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to retrieve units of measure.', error)
  }

  const units = data.uomList
  if (units.length === 0) {
    console.log('No units of measure found.')
    return
  }

  const colCode = Math.max('Code'.length, ...units.map((u) => u.uomCode.length))
  const colSingular = Math.max('Singular'.length, ...units.map((u) => u.singularis.length))
  const colPlural = Math.max('Plural'.length, ...units.map((u) => u.pluralis.length))

  console.log(`${'Code'.padEnd(colCode)}  ${'Singular'.padEnd(colSingular)}  Plural`)
  console.log(`${'-'.repeat(colCode)}  ${'-'.repeat(colSingular)}  ${'-'.repeat(colPlural)}`)
  for (const u of units) {
    console.log(`${u.uomCode.padEnd(colCode)}  ${u.singularis.padEnd(colSingular)}  ${u.pluralis}`)
  }
}
