import { seedDatabase } from './seedDatabase';

export const seedInitialAdmin = async (): Promise<void> => {
  await seedDatabase();
};

if (require.main === module) {
  seedInitialAdmin().catch((error) => {
    console.error('❌ Error during initial admin seed:', error);
    process.exit(1);
  });
}
