import { execSync } from 'child_process'
import pkg from '../package.json' with {type: "json"}

const getResolutions = () => {
  const resolutions = Object.keys(pkg.resolutions || {})
  const ret = {};
  for (let i = 0; i < resolutions.length; i++) {
    const oldVersion = pkg.resolutions[resolutions[i]]
    const name = resolutions[i]
    console.log(name, oldVersion)
    const {version} = getReleaseDate(name, oldVersion)
    if (version !== oldVersion) {
      ret[name] = {latest: version}
    }
  }
  return ret
}

const getOutdated = () => {
  let json = {}
  try {
    const output = execSync('npm outdated --json', { stdio: 'pipe' }).toString()
    json = JSON.parse(output)
  } catch (err) {
    if (err.stdout) {
      json = JSON.parse(err.stdout.toString())
    } else {
      throw err
    }
  }
  return Object.entries(json).reduce((acc, curr) => {
    const currKey = curr[0]
    const currEntry = curr[1]
    let latest
    if (Array.isArray(currEntry)) {
      latest = currEntry[0].latest
    } else {
      latest = currEntry.latest
    }
    acc[currKey] = { latest }
    return acc
  }, {})
}

const getReleaseDate = (pkg, version) => {
  let json = {}
  try {
    const output = execSync(`npm view ${pkg} time repository version --json`, {
      stdio: 'pipe',
    }).toString()
    json = JSON.parse(output)
  } catch (err) {
    if (err.stdout) {
      json = JSON.parse(err.stdout.toString())
    } else {
      throw err
    }
  }
  let url = json.repository?.url || ''
  url = url.replace(/^.*\:\/\//i, 'https://').replace(/.git$/i, '')
  return {
    time: new Date(json.time[version]),
    url: url ? `${url}/releases` : undefined,
    version: json.version,
  }
}

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const printDate = (date) => {
  const now = Date.now()
  const then = date.getTime()
  let diff = now - then
  const days = Math.floor(diff / DAY)
  diff -= days * DAY
  const hours = Math.floor(diff / HOUR)
  diff -= hours * HOUR
  const minutes = Math.floor(diff / MINUTE)
  return days + 'd ' + hours + 'h ' + minutes + 'm'
}

const cutOffDate = new Date()
let workdays = 0
while (workdays < 3) {
  cutOffDate.setDate(cutOffDate.getDate() - 1)
  if (cutOffDate.getDay() !== 0 && cutOffDate.getDay() !== 6) {
    workdays += 1
  }
}

const merge = (a, b) => {
  const ret = {}
  for (const entry of Object.entries(a)) {
    ret[entry[0]] = entry[1]
  }
  for (const entry of Object.entries(b)) {
    ret[entry[0]] = entry[1]
  }
  return ret
}

const printTable = (pkgs, title) => {
  const entries = Object.entries(pkgs)
  const upgradesList = []
  console.log(`${entries.length} upgrades`)
  for (let i = 0; i < entries.length; i++) {
    const [pkg, d] = entries[i]
    console.log(`${pkg} ${d.latest}`)
    const release = getReleaseDate(pkg, d.latest)
    delete release.version
    let shouldUpgrade = cutOffDate.getTime() > release.time.getTime()
    shouldUpgrade = pkg.startsWith('@sebspark/') || shouldUpgrade
    upgradesList.push({
      name: pkg,
      ...d,
      ...release,
      age: printDate(release.time),
      shouldUpgrade: shouldUpgrade ? '✅' : '❌',
    })
  }
  return () => {
    console.log(title)
    console.table(upgradesList)
  }
}

const outdated = getOutdated()
const resolutions = getResolutions()
const p1 = printTable(outdated, 'Outdated')
const p2 = printTable(resolutions, 'Resolutions')
p1()
p2()
process.exit(1)
