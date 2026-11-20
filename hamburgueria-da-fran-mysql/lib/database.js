'use strict';
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter(k => !String(process.env[k] || '').trim());
if (missing.length) throw new Error(`Variáveis MySQL ausentes: ${missing.join(', ')}. Copie .env.example para .env.`);
const pool = mysql.createPool({
  host: process.env.DB_HOST.trim(),
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME.trim(),
  waitForConnections: true,
  connectionLimit: Math.min(12, Math.max(2, Number(process.env.DB_POOL_SIZE || 5))),
  queueLimit: 50,
  charset: 'utf8mb4',
  decimalNumbers: true,
  timezone: 'Z',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(process.env.DB_SSL === 'true' ? { ssl: { minVersion: 'TLSv1.2' } } : {})
});

function diagnostic(err) {
  switch (err.code) {
    case 'ER_DBACCESS_DENIED_ERROR': return 'Usuário MySQL sem permissão sobre esse banco. No hPanel, associe o usuário ao banco correto e confira DB_NAME e DB_USER (incluindo prefixos).';
    case 'ER_ACCESS_DENIED_ERROR': return 'Usuário ou senha MySQL incorretos. Confira DB_USER e DB_PASSWORD.';
    case 'ER_BAD_DB_ERROR': return 'O banco indicado em DB_NAME não existe ou tem nome incorreto.';
    case 'ENOTFOUND': return 'DB_HOST inválido. Copie o host exibido pelo provedor; não use nomes de exemplo.';
    case 'ECONNREFUSED': return 'A conexão foi recusada. Confira DB_HOST, DB_PORT e se o servidor aceita conexões.';
    case 'ETIMEDOUT': return 'Tempo esgotado ao conectar. Verifique firewall, acesso remoto e DB_HOST.';
    case 'ER_TABLEACCESS_DENIED_ERROR': return 'O usuário não possui permissão para criar ou alterar tabelas. Importe sql/schema.sql via phpMyAdmin e reinicie.';
    default: return err.message || 'Erro de conexão MySQL.';
  }
}

async function initDatabase(seed) {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    // Arquivo igualmente importável no phpMyAdmin, sem criar banco ou usuário.
    const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
    if (process.env.DB_SKIP_SCHEMA !== 'true') {
      const queries = schema.replace(/^\s*--.*$/gm, '').split(';').map(q => q.trim()).filter(Boolean);
      for (const sql of queries) await conn.query(sql);
    }
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT id FROM site_settings WHERE id = 1 FOR UPDATE');
    if (!existing.length) {
      await conn.execute('INSERT INTO site_settings(id, payload) VALUES (1, ?)', [JSON.stringify(seed.settings)]);
      for (const p of seed.products) await insertProduct(p, conn);
      for (const p of seed.promos) await insertPromo(p, conn);
    }
    await conn.commit();
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}
const asProduct = r => ({ id:r.id, name:r.name, category:r.category, description:r.description,
  price:Number(r.price), image:r.image, featured:!!r.featured, available:!!r.available, sort:r.sort_order });
const asPromo = r => ({ id:r.id, badge:r.badge, title:r.title, text:r.text, image:r.image, active:!!r.active });
const asOrder = r => ({ id:`FR-${String(r.id).padStart(5,'0')}`, createdAt:new Date(r.created_at).toISOString(),
  status:r.status, customer:r.customer, phone:r.phone, type:r.order_type, address:r.address,
  reference:r.reference_point, payment:r.payment, note:r.note, subtotal:Number(r.subtotal),
  fee:r.delivery_fee === null ? null : Number(r.delivery_fee), total:r.total === null ? null : Number(r.total), items:[] });

async function getSettings(conn=pool) {
  const [rows] = await conn.query('SELECT payload FROM site_settings WHERE id = 1 LIMIT 1');
  if (!rows.length) throw new Error('Configurações não encontradas no MySQL.');
  return typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
}
async function setSettings(settings) {
  await pool.execute('UPDATE site_settings SET payload = ? WHERE id = 1', [JSON.stringify(settings)]);
}
async function getProducts(onlyActive=false) {
  const [rows] = await pool.query(`SELECT * FROM products ${onlyActive?'WHERE available = 1':''} ORDER BY sort_order ASC, created_at ASC`);
  return rows.map(asProduct);
}
async function getPromos(onlyActive=false) {
  const [rows] = await pool.query(`SELECT * FROM promotions ${onlyActive?'WHERE active = 1':''} ORDER BY created_at ASC`);
  return rows.map(asPromo);
}
async function getSite() {
  const [settings, products, promos] = await Promise.all([getSettings(), getProducts(true), getPromos(true)]);
  return {settings, products, promos};
}
async function insertProduct(p,conn=pool) {
  await conn.execute('INSERT INTO products(id,name,category,description,price,image,featured,available,sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
    [p.id,p.name,p.category,p.description,p.price,p.image,p.featured?1:0,p.available?1:0,p.sort]);
}
async function updateProduct(p) {
  const [result] = await pool.execute('UPDATE products SET name=?,category=?,description=?,price=?,image=?,featured=?,available=?,sort_order=? WHERE id=?',
    [p.name,p.category,p.description,p.price,p.image,p.featured?1:0,p.available?1:0,p.sort,p.id]);
  return result.affectedRows > 0;
}
async function removeProduct(id) {
  const [r] = await pool.execute('DELETE FROM products WHERE id = ?', [id]); return r.affectedRows > 0;
}
async function insertPromo(p,conn=pool) {
  await conn.execute('INSERT INTO promotions(id,badge,title,text,image,active) VALUES (?,?,?,?,?,?)',
    [p.id,p.badge,p.title,p.text,p.image,p.active?1:0]);
}
async function updatePromo(p) {
  const [r] = await pool.execute('UPDATE promotions SET badge=?,title=?,text=?,image=?,active=? WHERE id=?',
    [p.badge,p.title,p.text,p.image,p.active?1:0,p.id]); return r.affectedRows > 0;
}
async function removePromo(id) {
  const [r] = await pool.execute('DELETE FROM promotions WHERE id=?',[id]); return r.affectedRows > 0;
}
async function getOrders() {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY id DESC LIMIT 500');
  if (!rows.length) return [];
  const orders = rows.map(asOrder);
  const ids = rows.map(r=>Number(r.id));
  const marks = ids.map(()=>'?').join(',');
  const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id IN (${marks}) ORDER BY id ASC`, ids);
  const byId = new Map(orders.map((o,i)=>[Number(rows[i].id),o]));
  for (const x of items) byId.get(Number(x.order_id))?.items.push({id:x.product_id,name:x.product_name,price:Number(x.unit_price),quantity:x.quantity,total:Number(x.line_total)});
  return orders;
}
async function getAdminData() {
  const [settings,products,promos,orders] = await Promise.all([getSettings(),getProducts(),getPromos(),getOrders()]);
  return {version:2,settings,products,promos,orders};
}
async function createOrder(payload, inputItems) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [products] = await conn.query('SELECT * FROM products WHERE available=1');
    const byId = new Map(products.map(row => [row.id,asProduct(row)]));
    const used = new Set();
    const items = inputItems.map(row => {
      const p = byId.get(row.id), q=Number(row.quantity);
      if (!p || used.has(row.id) || !Number.isInteger(q) || q<1 || q>30) throw Object.assign(new Error('Confira os produtos e quantidades do carrinho.'), { validation:true });
      used.add(row.id);
      return {id:p.id,name:p.name,price:p.price,quantity:q,total:Math.round(p.price*q*100)/100};
    });
    const subtotal=Math.round(items.reduce((n,x)=>n+x.total,0)*100)/100;
    const settings=await getSettings(conn);
    const fee=payload.type==='delivery' ? settings.deliveryFee : 0;
    const total=fee===null ? null : Math.round((subtotal+fee)*100)/100;
    const [insert] = await conn.execute(`INSERT INTO orders
      (status,customer,phone,order_type,address,reference_point,payment,note,subtotal,delivery_fee,total)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['Aguardando envio no WhatsApp',payload.customer,payload.phone,payload.type,
        payload.type==='delivery'?payload.address:'',payload.type==='delivery'?payload.reference:'',
        payload.payment,payload.note,subtotal,fee,total]);
    for (const p of items) await conn.execute('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES (?,?,?,?,?,?)',
      [insert.insertId,p.id,p.name,p.price,p.quantity,p.total]);
    await conn.commit();
    return {id:`FR-${String(insert.insertId).padStart(5,'0')}`,items,subtotal,fee,total,settings};
  } catch(err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}
function numFromOrderId(id) {
  if (!/^FR-\d{5,18}$/.test(id)) return null;
  return String(BigInt(id.slice(3)));
}
async function changeOrderStatus(id,status) {
  const num=numFromOrderId(id); if(!num)return false;
  const [r] = await pool.execute('UPDATE orders SET status=? WHERE id=?',[status,num]);return r.affectedRows>0;
}
async function removeOrder(id) {
  const num=numFromOrderId(id); if(!num)return false;
  const [r]=await pool.execute('DELETE FROM orders WHERE id=?',[num]);return r.affectedRows>0;
}
module.exports = {pool, initDatabase, diagnostic, getSettings, setSettings, getProducts, getPromos, getSite,
  getAdminData, insertProduct, updateProduct, removeProduct, insertPromo, updatePromo, removePromo,
  createOrder, changeOrderStatus, removeOrder};
