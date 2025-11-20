import { Client } from 'pg'

const client = new Client({
  host: 'koconi_db',
  port: 5432,
  user: 'postgres_user',
  password: 'postgres_password',
  database: 'koconi',
})

await client.connect()
export default client
