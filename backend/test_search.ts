import { ProductRepository } from './src/repositories';
import { prisma } from './src/db/client';

async function test() {
  try {
    const res = await ProductRepository.search('leche');
    console.log('Got results:', res.length);
    console.log(res);
  } catch(e) {
    console.error('ERROR OCCURRED:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
