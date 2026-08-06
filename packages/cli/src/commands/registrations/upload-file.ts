import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { basename, extname } from 'path'
import { getClient } from '../../lib/client.js'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { fail, apiError } from '../../lib/error.js'

interface UploadFileOptions {
  company?: string
  file?: string
  name?: string
  date?: string
  comment?: string
  visible?: boolean
}

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.txt': 'text/plain',
}

export function inferContentType(path: string): string {
  return CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream'
}

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
  cmd
    .option('--file <path>', 'path to the receipt file (required, e.g. receipt.pdf)')
    .option('--name <name>', 'friendly file name shown in Multi-Regnskab (defaults to file name)')
    .option('--date <date>', 'date associated with the file, e.g. 2026-03-07 (defaults to today server-side)')
    .option('--comment <text>', 'initial comment attached to the file')
    .option('--visible', 'make the file appear in the inbox immediately (default: hidden until referenced)')
}

export async function uploadFileFromPath(
  cmd: Command,
  companyXid: number,
  path: string,
  opts: { name?: string; date?: string; comment?: string; visible?: boolean } = {}
): Promise<number> {
  if (!existsSync(path)) {
    fail(cmd, `File not found: ${path}`)
  }

  const buf = readFileSync(path)
  const fileName = basename(path)
  const contentType = inferContentType(path)

  if (opts.date && !/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) {
    fail(cmd, `Invalid date format: ${opts.date}. Expected YYYY-MM-DD.`)
  }

  const client = getClient()
  const { data, error, response } = await client.POST('/filesForUseInRegistrations', {
    body: {
      companyXid,
      fileBodyBase64: buf.toString('base64'),
      contentType,
      fileName,
      friendlyFilename: opts.name ?? fileName,
      keepHiddenUntilRegistration: !opts.visible,
      ...(opts.date && { date: opts.date }),
      ...(opts.comment && { comment: opts.comment }),
    },
  })

  if (error || !data) {
    apiError(cmd, `Failed to upload file: ${path}`, error, response)
  }

  return data.xid
}

export async function uploadFile(options: UploadFileOptions, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)
  if (!options.file) fail(cmd, '--file <path> is required')

  const xid = await uploadFileFromPath(cmd, companyXid, options.file!, {
    name: options.name,
    date: options.date,
    comment: options.comment,
    visible: options.visible,
  })

  console.log('File uploaded successfully.')
  console.log(`ID: ${xid}`)
}
