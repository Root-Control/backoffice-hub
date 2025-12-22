import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'identity_backoffice';

async function seedSource() {
  const client = new MongoClient(`${MONGODB_URI}/${MONGODB_DB}`);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);

    // Seed tenants
    await db.collection('source_tenants').insertOne({
      id: 'regnum-christi',
      enabled: true,
      name: 'Regnum Christi',
      password_check_url: 'https://auth.regnumchristi.org/check',
      version: 1,
      updated_at: new Date(),
    });
    console.log('✓ Seeded tenant: regnum-christi');

    // Seed clients
    await db.collection('source_clients').insertOne({
      id: 'semperaltius',
      enabled: true,
      name: 'Semper Altius',
      redirect_uris: ['https://pagos.semperaltius.edu.mx/callback'],
      pkce_required: true,
      version: 1,
      updated_at: new Date(),
    });
    console.log('✓ Seeded client: semperaltius');

    // Seed subtenants
    await db.collection('source_subtenants').insertOne({
      id: 'rcsa',
      tenant_id: 'regnum-christi',
      enabled: true,
      name: 'RCSA',
      version: 1,
      updated_at: new Date(),
    });
    console.log('✓ Seeded subtenant: rcsa');

    // Seed domains
    await db.collection('source_domains').insertOne({
      host: 'pagos.semperaltius.edu.mx',
      enabled: true,
      tenant_id: 'regnum-christi',
      default_subtenant_id: 'rcsa',
      client_id: 'semperaltius',
      version: 1,
      updated_at: new Date(),
    });
    console.log('✓ Seeded domain: pagos.semperaltius.edu.mx');

    // Seed branding
    await db.collection('source_brandings').insertOne({
      id: 'branding_rcsa_001',
      scope: 'subtenant',
      tenant_id: 'regnum-christi',
      subtenant_id: 'rcsa',
      version: 1,
      updated_at: new Date(),
    });
    console.log('✓ Seeded branding: branding_rcsa_001');

    console.log('\n✅ Source data seeded successfully!');
  } catch (error) {
    console.error('Error seeding source:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedSource();

