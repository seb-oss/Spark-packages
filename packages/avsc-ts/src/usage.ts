import boxen from 'boxen'
import chalk from 'chalk'

export const usage = chalk.magenta(`
Usage: avsc-ts --input ./schemas --output ./dist \n

${boxen(chalk.green('\n' + 'Generates Typescript from avro files' + '\n'), {
  padding: 1,
  borderColor: 'green',
  dimBorder: true,
})}
`)
