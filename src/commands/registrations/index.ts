import { createArea } from '../../lib/area.js'
import { setup as uploadFileSetup, uploadFile } from './upload-file.js'
import { setup as createSetup, create } from './create.js'

export const registrationsArea = createArea({
  name: 'registrations',
  description: 'Bookkeeping registrations and receipt uploads',
  info: `The registrations area creates suggested bookkeeping registrations (pending user accept in Multi-Regnskab)
and uploads receipt files that can be attached to them.

Typical flow:
  1. mr registrations upload-file --company <xid> --file receipt.pdf
     -> prints a file ID
  2. mr registrations create --company <xid> --lines lines.json --file <fileId>

Or in one shot:
  mr registrations create --company <xid> --lines lines.json --attach-file receipt.pdf

Bank posting convenience:
  mr registrations create --company <xid> --lines lines.json \\
    --from-bank-posting <xid> --bank-account <xid>
  Pre-fills date and description from the bank posting. The CLI validates that at least one
  line in --lines has an amount matching the bank posting amount, so the two are consistent.
  No bankPostingXid is sent to the API — the reconciliation still happens when a user accepts
  the suggested registration in Multi-Regnskab.`,
  subcommands: [
    {
      name: 'upload-file',
      description: 'Upload a receipt file for use in a registration',
      info: `Uploads a local file to Multi-Regnskab and prints its ID. That ID is then passed to
mr registrations create via --file <xid>.

Required:
  --company <xid>   Company ID
  --file <path>     Path to the local file (pdf, png, jpg, etc.)

Optional:
  --name <name>     Friendly file name shown in Multi-Regnskab (defaults to file name)
  --date <date>     Date associated with the file, e.g. 2026-03-07 (defaults to today server-side)
  --comment <text>  Initial comment attached to the file
  --visible         Make the file appear in the inbox immediately.
                    By default the file is hidden until referenced by a registration.

The content type is inferred from the file extension.`,
      setup: uploadFileSetup,
      action: uploadFile,
    },
    {
      name: 'create',
      description: 'Create a suggested registration (bookkeeping entry)',
      info: `Creates a suggested registration for the given company. Once created it appears in
Multi-Regnskab for a user to review and accept.

Required:
  --company <xid>       Company ID
  --lines <file>        Path to a JSON array of debit/credit lines

  Plus a date and description, supplied either directly (--date and --description)
  or inherited via --from-bank-posting.

Line fields:
  accountNumber   Finance account, e.g. "3020" (required)
  amount          Line amount as a string. Negative for credits, positive for debits.
                  Danish format ("-1.250,00") and international ("-1250.00") both accepted.
  vatCode         VAT code, e.g. "DKI25" (optional)

Lines must reflect classic double-entry: the sum of all line amounts should balance to zero.

Optional:
  --supplier <xid>              Attach the registration to a supplier
  --customer <xid>              Attach the registration to a customer
  --file <xid>                  Attach a previously-uploaded file (repeatable, max 3 total)
  --attach-file <path>          Upload a local file and attach it in one command
                                (repeatable, max 3 total combined with --file)
  --from-bank-posting <xid>     Pre-fill date and description from a bank posting.
                                Requires --bank-account. The CLI validates that at least one
                                line's amount matches the bank posting amount and rejects
                                otherwise. No bankPostingXid is sent to the API.
  --bank-account <xid>          Bank account containing the posting referenced above.
  --posting-from <date>         Earliest bank-posting date to search when looking up
                                --from-bank-posting (default: one year ago).
  --posting-to <date>           Latest bank-posting date to search when looking up
                                --from-bank-posting (default: today).

Example lines.json for "-100 drawn from bank, split into 45 travel + 55 taxi":
[
  { "accountNumber": "5820", "amount": "-100,00" },
  { "accountNumber": "3620", "amount": "45,00" },
  { "accountNumber": "3630", "amount": "55,00" }
]

Full command using the bank-posting shortcut and inline upload:
  mr registrations create --company 123 \\
    --from-bank-posting 987 --bank-account 42 \\
    --lines lines.json --attach-file receipt.pdf`,
      setup: createSetup,
      action: create,
    },
  ],
})
