import * as readline from 'readline'

export async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

export async function promptPassword(question: string): Promise<string> {
  process.stdout.write(question)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf-8')

  return new Promise((resolve) => {
    let password = ''
    const onData = (char: string) => {
      if (char === '\r' || char === '\n') {
        process.stdin.removeListener('data', onData)
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdout.write('\n')
        resolve(password)
      } else if (char === '\u0003') {
        process.exit()
      } else if (char === '\u007f') {
        password = password.slice(0, -1)
      } else {
        password += char
      }
    }
    process.stdin.on('data', onData)
  })
}
