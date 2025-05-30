import envConfig from 'src/shared/config'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleName } from '../src/shared/constants/role.constant'


const prisma = new PrismaService()
const hash = new HashingService()

async function main() {

  const roleList = await prisma.role.findMany()
  if (roleList.length > 0) {
    throw new Error('Roles already exist')
  }

 const roles = await prisma.role.createMany({
  data: [
    {
      name: RoleName.Admin,
      description: 'Admin',
    },
     {
      name: RoleName.Seller,
      description: 'Seller',
    },
    {
      name: RoleName.Client,
      description: 'Client',
    },
  ],
 })

 const adminRole = await prisma.role.findFirstOrThrow({
  where: {
    name: RoleName.Admin,
  },
 })

 const hashedPassword = await hash.hash(envConfig.ADMIN_PW)
 const adminUser = await prisma.user.create({
  data: {
    email: envConfig.ADMIN_EMAIL,
    password: hashedPassword,
    roleId: adminRole.id,
    name: envConfig.ADMIN_NAME,
    phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
  },
 })

 return {
  adminUser,
  createdRoles: roles.count,
 }

}
main().then(({ adminUser, createdRoles }) => {
  console.log(`Admin user created: ${adminUser.email}`)
  console.log(`Created ${createdRoles} roles`)
}).catch(console.error)

