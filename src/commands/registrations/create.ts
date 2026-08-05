import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { createClient } from '../../api/client.js'
import { setupCompanyOption, parseCompanyXid } from '../../lib/company.js'
import { fail, apiError } from '../../lib/error.js'
import { uploadFileFromPath } from './upload-file.js'

interface DebitCreditLineInput {
  accountNumber: string
  vatCode?: string
  amount: string
}

interface CreateOptions {
  company?: string
  date?: string
  description?: string
  supplier?: string
  customer?: string
  lines?: string
  file?: string[]
  attachFile?: string[]
  fromBankPosting?: string
  bankAccount?: string
  postingFrom?: string
  postingTo?: string
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function oneYearAgoIso(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return isoDate(d)
}

const MAX_ATTACHED_FILES = 3

function collect(value: string, previous: string[]): string[] {
  return [...previous, value]
}

function parseAmount(s: string): number | null {
  const cleaned = s.trim().replace(/\s/g, '')
  if (!cleaned) return null
  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')
  let normalized: string
  if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, '')
  } else if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(',', '.')
  }
  const n = parseFloat(normalized)
  return isNaN(n) ? null : n
}

function amountsMatch(a: string, b: string): boolean {
  const na = parseAmount(a)
  const nb = parseAmount(b)
  if (na === null || nb === null) return false
  return Math.abs(na - nb) < 0.005
}

export function setup(cmd: Command) {
  setupCompanyOption(cmd)
  cmd
    .option('--date <date>', 'registration date, e.g. 2026-03-07 (required unless --from-bank-posting is used)')
    .option('--description <text>', 'registration description (required unless --from-bank-posting supplies bank text)')
    .option('--supplier <xid>', 'supplier ID (optional)')
    .option('--customer <xid>', 'customer ID (optional)')
    .option('--lines <file>', 'path to JSON file containing debit/credit lines (required)')
    .option('--file <xid>', 'attach an already-uploaded file by xid (repeatable, max 3 total)', collect, [] as string[])
    .option('--attach-file <path>', 'upload a local file and attach it in one go (repeatable, max 3 total)', collect, [] as string[])
    .option('--from-bank-posting <xid>', 'pre-fill date/description from a bank posting (requires --bank-account)')
    .option('--bank-account <xid>', 'bank account ID used with --from-bank-posting (run mr bank accounts to find)')
    .option('--posting-from <date>', 'earliest bank-posting date to search when looking up --from-bank-posting, e.g. 2025-01-01 (default: one year ago)')
    .option('--posting-to <date>', 'latest bank-posting date to search when looking up --from-bank-posting, e.g. 2026-08-05 (default: today)')
}

export async function create(options: CreateOptions, cmd: Command) {
  const companyXid = parseCompanyXid(options, cmd)

  if (!options.lines) fail(cmd, '--lines <file> is required. Provide a path to a JSON file with debit/credit lines.')
  if (!existsSync(options.lines!)) fail(cmd, `Lines file not found: ${options.lines}`)

  let lines: DebitCreditLineInput[]
  try {
    lines = JSON.parse(readFileSync(options.lines!, 'utf-8')) as DebitCreditLineInput[]
  } catch {
    fail(cmd, `Failed to parse lines file: ${options.lines}. Ensure it is valid JSON.`)
  }
  if (!Array.isArray(lines!) || lines.length === 0) {
    fail(cmd, 'Lines file must contain a non-empty JSON array.')
  }
  for (let i = 0; i < lines!.length; i++) {
    const line = lines![i]
    if (!line.accountNumber) fail(cmd, `Line ${i}: missing required field "accountNumber"`)
    if (line.amount === undefined || line.amount === null || line.amount === '') {
      fail(cmd, `Line ${i}: missing required field "amount"`)
    }
    if (parseAmount(String(line.amount)) === null) {
      fail(cmd, `Line ${i}: amount "${line.amount}" is not a valid number`)
    }
  }

  let date = options.date
  let description = options.description
  let bankPostingAmount: string | undefined

  if (options.fromBankPosting) {
    if (!options.bankAccount) {
      fail(cmd, '--from-bank-posting requires --bank-account <xid>. Run mr bank accounts --company <xid> to find it.')
    }
    const bankPostingXid = parseInt(options.fromBankPosting, 10)
    const bankAccountXid = parseInt(options.bankAccount!, 10)
    if (isNaN(bankPostingXid)) fail(cmd, `Invalid bank posting ID: ${options.fromBankPosting}`)
    if (isNaN(bankAccountXid)) fail(cmd, `Invalid bank account ID: ${options.bankAccount}`)

    if (options.postingFrom && !/^\d{4}-\d{2}-\d{2}$/.test(options.postingFrom)) {
      fail(cmd, `Invalid --posting-from date format: ${options.postingFrom}. Expected YYYY-MM-DD.`)
    }
    if (options.postingTo && !/^\d{4}-\d{2}-\d{2}$/.test(options.postingTo)) {
      fail(cmd, `Invalid --posting-to date format: ${options.postingTo}. Expected YYYY-MM-DD.`)
    }

    const fromDateIncl = options.postingFrom ?? oneYearAgoIso()
    const toDateIncl = options.postingTo ?? isoDate(new Date())

    const client = createClient()
    const { data, error } = await client.GET('/bankPostings/{companyXid}/{bankAccountXid}', {
      params: {
        path: { companyXid, bankAccountXid },
        query: { fromDateIncl, toDateIncl },
      },
    })
    if (error || !data) apiError(cmd, 'Failed to fetch bank postings.', error)

    const posting = data.bpList.find((p) => p.xid === bankPostingXid)
    if (!posting) {
      fail(
        cmd,
        `Bank posting ${bankPostingXid} not found in account ${bankAccountXid} within ${fromDateIncl}..${toDateIncl}. ` +
          `Widen the search with --posting-from <date> --posting-to <date>, or confirm the posting exists with ` +
          `mr bank postings --company ${companyXid} --account ${bankAccountXid} --from <date> --to <date> --verbose.`
      )
    }

    date = date ?? posting.bankDate
    description = description ?? posting.bankText
    bankPostingAmount = posting.bankAmount

    if (!bankPostingAmount) {
      fail(cmd, `Bank posting ${bankPostingXid} has no amount — cannot validate against registration lines.`)
    }

    const hasMatch = lines!.some((l) => amountsMatch(String(l.amount), bankPostingAmount!))
    if (!hasMatch) {
      const printed = lines!.map((l, i) => `  [${i}] ${l.accountNumber}: ${l.amount}`).join('\n')
      fail(
        cmd,
        `No line matches bank posting amount ${bankPostingAmount}. Include the bank line explicitly in --lines.\n` +
          `Lines provided:\n${printed}`
      )
    }
  }

  if (!date) fail(cmd, '--date <date> is required (or use --from-bank-posting to inherit it).')
  if (!description) fail(cmd, '--description <text> is required (or use --from-bank-posting to inherit it).')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(cmd, `Invalid date format: ${date}. Expected YYYY-MM-DD.`)

  const supplierXid = options.supplier ? parseInt(options.supplier, 10) : undefined
  const customerXid = options.customer ? parseInt(options.customer, 10) : undefined
  if (options.supplier && isNaN(supplierXid!)) fail(cmd, `Invalid supplier ID: ${options.supplier}`)
  if (options.customer && isNaN(customerXid!)) fail(cmd, `Invalid customer ID: ${options.customer}`)

  const fileXids: number[] = []
  for (const raw of options.file ?? []) {
    const n = parseInt(raw, 10)
    if (isNaN(n)) fail(cmd, `Invalid --file xid: ${raw}`)
    fileXids.push(n)
  }
  const totalPlanned = fileXids.length + (options.attachFile?.length ?? 0)
  if (totalPlanned > MAX_ATTACHED_FILES) {
    fail(cmd, `Too many files: ${totalPlanned}. A registration can have at most ${MAX_ATTACHED_FILES}.`)
  }

  for (const path of options.attachFile ?? []) {
    const xid = await uploadFileFromPath(cmd, companyXid, path)
    console.log(`Uploaded ${path} -> ${xid}`)
    fileXids.push(xid)
  }

  const client = createClient()
  const { data, error } = await client.POST('/suggestedRegistrations', {
    body: {
      companyXid,
      date,
      description,
      ...(supplierXid && { supplierXid }),
      ...(customerXid && { customerXid }),
      debitCreditlines: lines!.map((l) => ({
        accountNumber: l.accountNumber,
        amount: String(l.amount),
        ...(l.vatCode && { vatCode: l.vatCode }),
      })),
      ...(fileXids.length > 0 && { filesToAttachXids: fileXids.map((xid) => ({ xid })) }),
    },
  })

  if (error || !data) {
    apiError(cmd, 'Failed to create suggested registration.', error)
  }

  console.log('Suggested registration created successfully.')
  console.log(`ID: ${data.xid}`)
}
