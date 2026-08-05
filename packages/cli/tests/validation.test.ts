import { spawnSync, write, file } from 'bun'
import { test, expect, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, rmSync } from 'fs'

const CLI = ['bun', 'run', 'src/index.ts']
const TMP = '/tmp/mr-test'

function mr(...args: string[]) {
  const result = spawnSync([...CLI, ...args], { stderr: 'pipe', stdout: 'pipe' })
  return {
    exitCode: result.exitCode,
    stderr: result.stderr.toString(),
    stdout: result.stdout.toString(),
  }
}

async function writeTmp(name: string, content: unknown) {
  const path = `${TMP}/${name}`
  await write(path, JSON.stringify(content))
  return path
}

beforeAll(() => mkdirSync(TMP, { recursive: true }))
afterAll(() => rmSync(TMP, { recursive: true, force: true }))

// ---------------------------------------------------------------------------
// invoices create — command-level required options
// ---------------------------------------------------------------------------

test('invoices create: missing --customer', () => {
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--date', '2026-01-01', '--lines', '/dev/null')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--customer')
})

test('invoices create: missing --date', () => {
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--lines', '/dev/null')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--date')
})

test('invoices create: missing --lines', () => {
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--lines')
})

test('invoices create: invalid date format', () => {
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '07-05-2026', '--lines', '/dev/null')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('YYYY-MM-DD')
})

// ---------------------------------------------------------------------------
// invoices create — line validation
// ---------------------------------------------------------------------------

test('invoices create: line missing lineText', async () => {
  const lines = await writeTmp('missing-linetext.json', [{ amount: '100', productTypeXid: 1 }])
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('lineText')
})

test('invoices create: line missing amount', async () => {
  const lines = await writeTmp('missing-amount.json', [{ lineText: 'Test', productTypeXid: 1 }])
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('amount')
})

test('invoices create: line missing productTypeXid', async () => {
  const lines = await writeTmp('missing-producttypexid.json', [{ lineText: 'Test', amount: '100' }])
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('productTypeXid')
})

test('invoices create: productXid without productTypeXid shows helpful error', async () => {
  const lines = await writeTmp('producttypexid-hint.json', [{ lineText: 'Test', amount: '100', productXid: 999 }])
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('productXid does not replace productTypeXid')
})

test('invoices create: empty lines array', async () => {
  const lines = await writeTmp('empty-lines.json', [])
  const { exitCode, stderr } = mr('invoices', 'create', '--company', '123', '--customer', '456', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('non-empty')
})

// ---------------------------------------------------------------------------
// customers create — required options
// ---------------------------------------------------------------------------

const baseCustomer = [
  '--company', '123',
  '--name', 'Test',
  '--currency', 'DKK',
  '--address1', 'Testvej 1',
  '--zip', '8000',
  '--city', 'Aarhus',
  '--country', 'DK',
  '--lang', 'DA',
  '--payment-terms', 'NET',
]

test('customers create: missing --name', () => {
  const args = baseCustomer.filter((v, i) => v !== '--name' && baseCustomer[i - 1] !== '--name')
  const { exitCode, stderr } = mr('customers', 'create', ...args)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--name')
})

test('customers create: missing --lang', () => {
  const args = baseCustomer.filter((v, i) => v !== '--lang' && baseCustomer[i - 1] !== '--lang')
  const { exitCode, stderr } = mr('customers', 'create', ...args)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--lang')
})

test('customers create: --einvoice without --einvoice-type', () => {
  const { exitCode, stderr } = mr('customers', 'create', ...baseCustomer, '--einvoice', '--einvoice-address', '12345678')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--einvoice-type')
})

test('customers create: --einvoice without --einvoice-address', () => {
  const { exitCode, stderr } = mr('customers', 'create', ...baseCustomer, '--einvoice', '--einvoice-type', 'DK_CVR')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--einvoice-address')
})

test('customers create: invalid --lang value', () => {
  const args = [...baseCustomer]
  args[args.indexOf('DA')] = 'XX'
  const { exitCode, stderr } = mr('customers', 'create', ...args)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--lang')
})

test('customers create: invalid --payment-terms value', () => {
  const args = [...baseCustomer]
  args[args.indexOf('NET')] = 'INVALID'
  const { exitCode, stderr } = mr('customers', 'create', ...args)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--payment-terms')
})

// ---------------------------------------------------------------------------
// registrations upload-file — required options
// ---------------------------------------------------------------------------

test('registrations upload-file: missing --company', () => {
  const { exitCode, stderr } = mr('registrations', 'upload-file', '--file', '/tmp/anything.pdf')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--company')
})

test('registrations upload-file: missing --file', () => {
  const { exitCode, stderr } = mr('registrations', 'upload-file', '--company', '123')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--file')
})

test('registrations upload-file: file not found', () => {
  const { exitCode, stderr } = mr('registrations', 'upload-file', '--company', '123', '--file', '/tmp/mr-test/does-not-exist.pdf')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('not found')
})

test('registrations upload-file: invalid date format', async () => {
  await write('/tmp/mr-test/dummy.pdf', 'not a real pdf')
  const { exitCode, stderr } = mr('registrations', 'upload-file', '--company', '123', '--file', '/tmp/mr-test/dummy.pdf', '--date', '07-05-2026')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('YYYY-MM-DD')
})

// ---------------------------------------------------------------------------
// registrations create — required options and lines validation
// ---------------------------------------------------------------------------

const validLines = [{ accountNumber: '3020', amount: '100,00' }]

test('registrations create: missing --lines', () => {
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--lines')
})

test('registrations create: lines file not found', () => {
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', '/tmp/mr-test/does-not-exist.json')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('not found')
})

test('registrations create: empty lines array', async () => {
  const lines = await writeTmp('reg-empty.json', [])
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('non-empty')
})

test('registrations create: line missing accountNumber', async () => {
  const lines = await writeTmp('reg-missing-account.json', [{ amount: '100,00' }])
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('accountNumber')
})

test('registrations create: line missing amount', async () => {
  const lines = await writeTmp('reg-missing-amount.json', [{ accountNumber: '3020' }])
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('amount')
})

test('registrations create: line has invalid amount', async () => {
  const lines = await writeTmp('reg-bad-amount.json', [{ accountNumber: '3020', amount: 'abc' }])
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('not a valid number')
})

test('registrations create: missing --date without --from-bank-posting', async () => {
  const lines = await writeTmp('reg-valid.json', validLines)
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--date')
})

test('registrations create: missing --description without --from-bank-posting', async () => {
  const lines = await writeTmp('reg-valid2.json', validLines)
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '2026-01-01', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--description')
})

test('registrations create: invalid --date format', async () => {
  const lines = await writeTmp('reg-valid3.json', validLines)
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--date', '07-05-2026', '--description', 'x', '--lines', lines)
  expect(exitCode).toBe(1)
  expect(stderr).toContain('YYYY-MM-DD')
})

test('registrations create: --from-bank-posting without --bank-account', async () => {
  const lines = await writeTmp('reg-valid4.json', validLines)
  const { exitCode, stderr } = mr('registrations', 'create', '--company', '123', '--description', 'x', '--lines', lines, '--from-bank-posting', '999')
  expect(exitCode).toBe(1)
  expect(stderr).toContain('--bank-account')
})

test('registrations create: too many files attached', async () => {
  const lines = await writeTmp('reg-valid5.json', validLines)
  const { exitCode, stderr } = mr(
    'registrations', 'create',
    '--company', '123', '--date', '2026-01-01', '--description', 'x', '--lines', lines,
    '--file', '1', '--file', '2', '--file', '3', '--file', '4',
  )
  expect(exitCode).toBe(1)
  expect(stderr).toContain('at most 3')
})
