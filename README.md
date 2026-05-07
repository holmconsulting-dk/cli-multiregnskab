# cli-multiregnskab

A command-line interface for the [Multiregnskab](https://multiregnskab.dk) accounting API. Installed as `mr`.

## Prerequisites

[Bun](https://bun.sh)

## Development

```sh
bun install       # Install dependencies
bun run dev       # Run CLI from source, e.g: bun run dev user login
bun run build     # Compile to dist/index.js
```

## Updating the API

The CLI is generated against `public-client-api-v1.yaml`. When the API spec changes:

1. Replace `public-client-api-v1.yaml` with the new version
2. Regenerate TypeScript types:
   ```sh
   bun run generate-api
   ```
3. Update any commands affected by the changes
4. Build and verify: `bun run build`

## Releasing

Releases are built and published automatically by GitHub Actions when a tag is pushed:

```sh
git tag v1.0.0
git push origin v1.0.0
```

This produces binaries for macOS (arm64/x64), Linux (x64), and Windows (x64), attached to a GitHub release. The version embedded in the binary comes from the tag name.

## Installation (end users)

Download the binary for your platform from the [releases page](https://github.com/holmconsulting-dk/cli-multiregnskab/releases) and make it executable:

```sh
chmod +x mr-macos-arm64
xattr -d com.apple.quarantine mr-macos-arm64  # macOS only, if downloaded via browser
```

## Usage

```sh
mr --help
mr <area> info         # e.g. mr invoices info
mr <area> <command> info  # e.g. mr invoices create info
```
