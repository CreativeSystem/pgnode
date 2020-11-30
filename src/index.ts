import './env'
import { Pool, PoolClient } from 'pg'
import faker from 'faker'
import readline from 'readline'


type User = {
  id:number,
  nome: string,
  email:string
}

const MENU = `Selecione uma opção:

1 - Insert
2 - Update
3 - Delete
4 - Select
0 - Sair 

Selecione uma opção:
`

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const pool = new Pool({
  connectionString : process.env.DATABASE_URL
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

function range(n : number) {
  return Array.from({ length: n }, (_, i) => i)
}

function random<T>(array : T[]) {
  return array[Math.floor(Math.random() * array.length)]
}

const users = range(10).map( i => [faker.name.findName(),faker.internet.email()])

async function insert(client: PoolClient){
  const inserted  = []

  for(let i = 0; i< users.length ; i++){
    const {rows:[insertedUser]} = await client.query<User>("INSERT INTO users (nome,email) VALUES($1,$2) RETURNING *", users[i])
    inserted.push(insertedUser)
  }
  console.info("\x1b[32m",'------------------------INSERT------------------------')
  print(inserted)
  console.log('\n')
}

async function select(client: PoolClient){
  const result = await client.query<User>("SELECT * FROM users");
  console.info("\x1b[32m",'------------------------SELECT------------------------')
  print(result.rows)
  console.log('\n')
}

async function update(client: PoolClient){
  const [nome] =random(users)
  const result = await client.query<User>("UPDATE users set nome = $1 where nome = $2 RETURNING *",[faker.name.findName(), nome]);
  console.info("\x1b[32m",'------------------------UPDATE------------------------')
  print(result.rows)
  console.log('\n')
}

async function remove(client: PoolClient){
  const result = await client.query<User>("DELETE FROM users RETURNING *");
  console.info("\x1b[32m",'------------------------DELETE------------------------')
  print(result.rows)
  console.log('\n')
}

function print(users: User[]){
  console.log("\x1b[37m",`id\tnome\t\t\t\temail`);
  users.forEach(({id,nome,email})=> console.log("\x1b[37m",`${id}\t${nome.substring(0,15)}\t\t\t${email}`))
  
}

async function connectDB(){
  return await pool.connect();
}

async function ask(question:string) {
  return new Promise((resolve, reject)=>{
    try{
      rl.question(question,(answer)=> resolve(answer));
    }catch(err){
      reject(err)
    }
  });
}

async function main(){
  const client = await connectDB();
  let option = null
  do{
    option = await ask(MENU);
    console.log('')
    switch(option){
      case '1':
        await insert(client)
        break;
      case '2':
        await update(client)
        break;
      case '3':
        await remove(client)
        break;
      case '4':
        await select(client)
        break;
    }

  }while(option !== '0')


  rl.close()
  pool.end()
  process.exit(0)
}

main();