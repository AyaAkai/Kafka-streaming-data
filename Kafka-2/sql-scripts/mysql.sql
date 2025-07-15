
create schema if not exists ecomm;
use ecomm;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

GRANT ALL PRIVILEGES ON ecomm.* TO 'myuser'@'%';

CREATE TABLE users (
                       user_id INT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL,
                       email VARCHAR(100) NOT NULL,
                       password VARCHAR(100) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
                          product_id INT AUTO_INCREMENT PRIMARY KEY,
                          name VARCHAR(100) NOT NULL,
                          description TEXT,
                          price DECIMAL(10, 2) NOT NULL,
                          stock_quantity INT NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
                        order_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT,
                        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
                             order_item_id INT AUTO_INCREMENT PRIMARY KEY,
                             order_id INT,
                             product_id INT,
                             quantity INT NOT NULL,
                             price DECIMAL(10, 2) NOT NULL,
                             FOREIGN KEY (order_id) REFERENCES orders(order_id),
                             FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO users (username, email, password)
VALUES
    ('user1', 'user1@example.com', 'password1'),
    ('user2', 'user2@example.com', 'password2'),
    ('user3', 'user3@example.com', 'password3');

-- Sample data for products table
INSERT INTO products (name, description, price, stock_quantity)
VALUES
    ('Product 1', 'Description for Product 1', 10.99, 100),
    ('Product 2', 'Description for Product 2', 15.49, 50),
    ('Product 3', 'Description for Product 3', 5.99, 200);

-- Sample data for orders table
INSERT INTO orders (user_id, order_date)
VALUES
    (1, '2024-04-13 08:00:00'),
    (2, '2024-04-13 08:30:00'),
    (3, '2024-04-13 09:00:00');

-- Sample data for order_items table
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
    (1, 1, 2, 21.98),
    (1, 2, 1, 15.49),
    (2, 1, 3, 32.97),
    (3, 3, 5, 29.95);

