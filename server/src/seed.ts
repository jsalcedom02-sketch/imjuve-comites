import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { initDb, execute, queryOne } from './database';

const METAS: { estado: string; poblacion: number; meta: number }[] = [
  { estado: 'MÉXICO', poblacion: 5140074, meta: 681 },
  { estado: 'JALISCO', poblacion: 2516531, meta: 333 },
  { estado: 'CIUDAD DE MÉXICO', poblacion: 2485237, meta: 329 },
  { estado: 'VERACRUZ DE IGNACIO DE LA LLAVE', poblacion: 2273752, meta: 301 },
  { estado: 'PUEBLA', poblacion: 2068428, meta: 274 },
  { estado: 'GUANAJUATO', poblacion: 1922066, meta: 254 },
  { estado: 'CHIAPAS', poblacion: 1757519, meta: 233 },
  { estado: 'NUEVO LEÓN', poblacion: 1738845, meta: 230 },
  { estado: 'MICHOACÁN DE OCAMPO', poblacion: 1418426, meta: 188 },
  { estado: 'OAXACA', poblacion: 1215528, meta: 161 },
  { estado: 'BAJA CALIFORNIA', poblacion: 1171364, meta: 155 },
  { estado: 'CHIHUAHUA', poblacion: 1139459, meta: 151 },
  { estado: 'GUERRERO', poblacion: 1072133, meta: 142 },
  { estado: 'TAMAULIPAS', poblacion: 1028023, meta: 136 },
  { estado: 'COAHUILA DE ZARAGOZA', poblacion: 938623, meta: 124 },
  { estado: 'HIDALGO', poblacion: 912000, meta: 121 },
  { estado: 'SINALOA', poblacion: 907331, meta: 120 },
  { estado: 'SONORA', poblacion: 887165, meta: 117 },
  { estado: 'SAN LUIS POTOSÍ', poblacion: 859435, meta: 114 },
  { estado: 'QUERÉTARO', poblacion: 739278, meta: 98 },
  { estado: 'TABASCO', poblacion: 710354, meta: 94 },
  { estado: 'YUCATÁN', poblacion: 700310, meta: 93 },
  { estado: 'QUINTANA ROO', poblacion: 587833, meta: 78 },
  { estado: 'MORELOS', poblacion: 582224, meta: 77 },
  { estado: 'DURANGO', poblacion: 558235, meta: 74 },
  { estado: 'ZACATECAS', poblacion: 478864, meta: 63 },
  { estado: 'AGUASCALIENTES', poblacion: 455228, meta: 60 },
  { estado: 'TLAXCALA', poblacion: 411929, meta: 55 },
  { estado: 'NAYARIT', poblacion: 361584, meta: 48 },
  { estado: 'CAMPECHE', poblacion: 271878, meta: 36 },
  { estado: 'BAJA CALIFORNIA SUR', poblacion: 240754, meta: 32 },
  { estado: 'COLIMA', poblacion: 214177, meta: 28 },
];

async function seed() {
  await initDb();

  // Seed metas por estado (UPSERT)
  for (const m of METAS) {
    await execute(`
      INSERT INTO estado_estadisticas (estado, poblacion_joven, meta_comites)
      VALUES ($est, $pob, $meta)
      ON CONFLICT (estado) DO NOTHING
    `, { $est: m.estado, $pob: m.poblacion, $meta: m.meta });
  }
  console.log(`✅ Metas cargadas para ${METAS.length} estados`);

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
