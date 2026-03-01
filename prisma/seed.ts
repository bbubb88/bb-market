import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 创建 HIT2 游戏
  const hit2 = await prisma.game.upsert({
    where: { id: 'hit2' },
    update: {},
    create: {
      id: 'hit2',
      name: 'HIT2',
      nameKo: '히트2',
      iconUrl: '/hit2-icon.png',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created game: ${hit2.name}`);

  // 原始世界服务器
  const originZones = [
    { id: 'kiki', name: '奇奇', nameKo: '키키' },
    { id: 'lena', name: '莉娜', nameKo: '레나' },
    { id: 'anika', name: '阿妮卡', nameKo: '아니카' },
    { id: 'lukas', name: '盧卡斯', nameKo: '루카스' },
    { id: 'hugo', name: '雨果', nameKo: '휴고' },
    { id: 'adele', name: '阿黛爾', nameKo: '아델' },
    { id: 'ada', name: '艾妲', nameKo: '에다' },
    { id: 'vilpa', name: '維勒巴', nameKo: '비르바' },
  ];

  // 平衡世界服务器
  const classicZones = [
    { id: 'arachnes', name: '亞拉克奈斯', nameKo: '아라크네스' },
    { id: 'rumia', name: '路米亞', nameKo: '루미아' },
    { id: 'crusta', name: '克魯斯塔', nameKo: '크루스타' },
    { id: 'inferdos', name: '因費爾多斯', nameKo: '인페르도스' },
  ];

  // 创建原始世界服务器 (8大区 × 5服务器)
  for (const zone of originZones) {
    for (let i = 1; i <= 5; i++) {
      await prisma.server.upsert({
        where: { id: `${zone.id}${i}` },
        update: {},
        create: {
          id: `${zone.id}${i}`,
          gameId: hit2.id,
          name: `${zone.name} ${i}区`,
          nameKo: `${zone.nameKo} ${i}서버`,
          zone: zone.id,
        },
      });
    }
  }
  console.log(`✅ Created ${originZones.length * 5} origin servers`);

  // 创建平衡世界服务器 (4大区 × 4服务器)
  for (const zone of classicZones) {
    for (let i = 1; i <= 4; i++) {
      await prisma.server.upsert({
        where: { id: `${zone.id}${i}` },
        update: {},
        create: {
          id: `${zone.id}${i}`,
          gameId: hit2.id,
          name: `${zone.name} ${i}区`,
          nameKo: `${zone.nameKo} ${i}서버`,
          zone: zone.id,
        },
      });
    }
  }
  console.log(`✅ Created ${classicZones.length * 4} classic servers`);

  // 创建系统设置
  await prisma.setting.upsert({
    where: { key: 'fee_rate' },
    update: {},
    create: {
      key: 'fee_rate',
      value: '0.05', // 5% 手续费
    },
  });

  await prisma.setting.upsert({
    where: { key: 'contact_whatsapp' },
    update: {},
    create: {
      key: 'contact_whatsapp',
      value: '+85244060902',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'contact_telegram' },
    update: {},
    create: {
      key: 'contact_telegram',
      value: '@bbmarket',
    },
  });

  console.log('✅ System settings created');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
