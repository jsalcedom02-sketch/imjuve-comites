import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { initDb, execute, queryOne } from './database';

async function seed() {
  await initDb();

  const hash = bcrypt.hashSync('0000', 10);

  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'ADMIN1' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'ADMIN1', $p: hash, $r: 'administrador', $s: '[]', $fn: 'Juan Pérez',
    });
    console.log('✅ ADMIN1 / 0000 (administrador — control total)');
  }
  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'ADMIN2' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'ADMIN2', $p: hash, $r: 'administrador', $s: '[]', $fn: 'Laura Mendoza',
    });
    console.log('✅ ADMIN2 / 0000 (administrador — control total)');
  }

  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'TERRI1' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'TERRI1', $p: hash, $r: 'territorial',
      $s: JSON.stringify(['CIUDAD DE MÉXICO', 'MÉXICO', 'JALISCO']),
      $fn: 'Carlos Hernández',
    });
    console.log('✅ TERRI1 / 0000 (territorial — CDMX, MÉX, JAL)');
  }
  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'TERRI2' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'TERRI2', $p: hash, $r: 'territorial',
      $s: JSON.stringify(['NUEVO LEÓN', 'VERACRUZ DE IGNACIO DE LA LLAVE', 'YUCATÁN']),
      $fn: 'Sofía Ramírez',
    });
    console.log('✅ TERRI2 / 0000 (territorial — NL, VER, YUC)');
  }

  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'COORD1' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'COORD1', $p: hash, $r: 'coordinador',
      $s: JSON.stringify(['NUEVO LEÓN']),
      $fn: 'María García',
    });
    console.log('✅ COORD1 / 0000 (coordinador — NUEVO LEÓN)');
  }
  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'COORD2' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'COORD2', $p: hash, $r: 'coordinador',
      $s: JSON.stringify(['JALISCO']),
      $fn: 'Pedro Sánchez',
    });
    console.log('✅ COORD2 / 0000 (coordinador — JALISCO)');
  }

  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'PROMO1' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'PROMO1', $p: hash, $r: 'promotor',
      $s: JSON.stringify(['VERACRUZ DE IGNACIO DE LA LLAVE']),
      $fn: 'Ana López',
    });
    console.log('✅ PROMO1 / 0000 (promotor — VERACRUZ DE IGNACIO DE LA LLAVE)');
  }
  if (!await queryOne('SELECT id FROM users WHERE username = $u', { $u: 'PROMO2' })) {
    await execute('INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)', {
      $id: uuid(), $u: 'PROMO2', $p: hash, $r: 'promotor',
      $s: JSON.stringify(['GUANAJUATO']),
      $fn: 'Roberto Díaz',
    });
    console.log('✅ PROMO2 / 0000 (promotor — GUANAJUATO)');
  }

  console.log('✅ Base de datos inicializada en PostgreSQL');
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
