-- Hamburgueria da Fran — MySQL 8.0+ / MariaDB 10.6+
-- Primeiro crie o banco pelo painel da hospedagem; selecione-o antes de importar.
-- Este arquivo não cria o banco, nem cria usuários, nem contém senhas.
CREATE TABLE IF NOT EXISTS site_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  payload JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(90) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description VARCHAR(450) NOT NULL DEFAULT '',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image VARCHAR(900) NOT NULL DEFAULT '',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  available TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_display (available, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  badge VARCHAR(35) NOT NULL DEFAULT '',
  title VARCHAR(100) NOT NULL,
  text VARCHAR(250) NOT NULL DEFAULT '',
  image VARCHAR(900) NOT NULL DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'Aguardando envio no WhatsApp',
  customer VARCHAR(90) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  order_type ENUM('delivery','pickup') NOT NULL,
  address VARCHAR(350) NOT NULL DEFAULT '',
  reference_point VARCHAR(150) NOT NULL DEFAULT '',
  payment VARCHAR(50) NOT NULL DEFAULT '',
  note VARCHAR(350) NOT NULL DEFAULT '',
  subtotal DECIMAL(12,2) NOT NULL,
  delivery_fee DECIMAL(12,2) NULL,
  total DECIMAL(12,2) NULL,
  INDEX idx_orders_created (created_at),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id CHAR(36) NOT NULL,
  product_name VARCHAR(90) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
