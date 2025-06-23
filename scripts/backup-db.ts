import { promises as fs } from 'fs'
import path from 'path'

async function main() {
  const dbPath = path.join('prisma', 'prisma', 'dev.db')
  const backupDir = path.join('backups')
  await fs.mkdir(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]
  const dest = path.join(backupDir, `dev-${timestamp}.db`)
  await fs.copyFile(dbPath, dest)
  console.log(`Backup created: ${dest}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})