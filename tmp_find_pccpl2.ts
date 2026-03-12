import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'info@pccpl.com.au' },
    include: { companies: true }
  });

  const locs = await prisma.location.findMany({
    where: { email: 'info@pccpl.com.au' },
    include: { company: true }
  });

  const mCompany = await prisma.company.findMany({
    where: { 
      OR: [
        { name: { contains: 'pccpl', mode: 'insensitive' } },
        { name: { contains: 'pacific', mode: 'insensitive' } },
        { website: { contains: 'pccpl', mode: 'insensitive' } }
      ]
    }
  });

  const usersWithNoCompany = await prisma.user.findMany({
    where: { companies: { none: {} } },
    select: { id: true, email: true }
  });

  const matches = [];
  for (const u of usersWithNoCompany) {
    const loc = await prisma.location.findFirst({
      where: { email: u.email }
    });
    if (loc) {
      matches.push({ userId: u.id, email: u.email, companyId: loc.companyId });
    }
  }

  const out = {
    user,
    locs: locs.map(l => ({ id: l.id, companyId: l.companyId, email: l.email, companyName: l.company.name })),
    mCompany: mCompany.map(c => ({ id: c.id, name: c.name, userId: c.userId })),
    usersWithNoCompanyCount: usersWithNoCompany.length,
    matchesCount: matches.length,
    matches
  };

  fs.writeFileSync('tmp_out.json', JSON.stringify(out, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
