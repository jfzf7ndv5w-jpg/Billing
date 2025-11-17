import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test landlord user
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'landlord@example.com' },
    update: {},
    create: {
      email: 'landlord@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Landlord',
      role: 'landlord'
    }
  });

  console.log('✅ Test user created:', user.email);

  // Create test property
  const property = await prisma.property.upsert({
    where: { id: 1 },
    update: {},
    create: {
      address: '123 Main Street',
      city: 'Amsterdam',
      postalCode: '1012AB',
      country: 'Netherlands',
      purchaseDate: new Date('2020-01-01'),
      purchasePrice: 300000,
      currentValue: 350000,
      propertyType: 'Apartment',
      squareMeters: 75,
      bedrooms: 2,
      bathrooms: 1
    }
  });

  console.log('✅ Test property created:', property.address);

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { email: 'tenant@example.com' },
    update: {},
    create: {
      propertyId: property.id,
      firstName: 'Jane',
      lastName: 'Tenant',
      email: 'tenant@example.com',
      phone: '+31 6 1234 5678',
      contractStartDate: new Date('2023-01-01'),
      monthlyRent: 1200,
      serviceCharges: 50,
      utilitiesAdvance: 75,
      depositAmount: 2400,
      depositPaidDate: new Date('2023-01-01'),
      isActive: true
    }
  });

  console.log('✅ Test tenant created:', tenant.email);

  // Create test vendor
  const vendor = await prisma.vendor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'ABC Plumbing Services',
      email: 'contact@abcplumbing.nl',
      phone: '+31 20 123 4567',
      specialization: 'Plumbing',
      averageRating: 4.5,
      jobsCompleted: 25
    }
  });

  console.log('✅ Test vendor created:', vendor.name);

  // Create test mortgage
  await prisma.mortgage.upsert({
    where: { id: 1 },
    update: {},
    create: {
      propertyId: property.id,
      lender: 'ING Bank',
      accountNumber: 'NL91INGB0001234567',
      originalAmount: 250000,
      currentBalance: 235000,
      interestRate: 3.5,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2050-01-01'),
      monthlyPayment: 1100
    }
  });

  console.log('✅ Test mortgage created');

  console.log('');
  console.log('========================================');
  console.log('🎉 Database seeded successfully!');
  console.log('========================================');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('   Email: landlord@example.com');
  console.log('   Password: password123');
  console.log('');
  console.log('📊 Test Data Created:');
  console.log('   - 1 User (landlord)');
  console.log('   - 1 Property (Amsterdam apartment)');
  console.log('   - 1 Tenant (active)');
  console.log('   - 1 Vendor (plumbing)');
  console.log('   - 1 Mortgage');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
