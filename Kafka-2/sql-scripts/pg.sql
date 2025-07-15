create table test_db.users
(
    _id       text not null
        primary key,
    data      jsonb,
    createdat timestamp with time zone default now()
);

create table test_db.orders
(
    _id       text not null
        primary key,
    data      jsonb,
    createdat timestamp with time zone default now()
);
alter table test_db.users
    owner to admin;

SELECT
    data ->> '_id' AS order_id,
    data ->> 'userId' AS user_id,
    data ->> 'status' AS status,
    data ->> 'orderDate' AS order_date,
    (data ->> 'totalAmount')::numeric AS total_amount,
    data ->> 'paymentMethod' AS payment_method,
    line_item ->> 'name' AS item_name,
    (line_item ->> 'price')::numeric AS item_price,
    (line_item ->> 'quantity')::int AS item_quantity,
    (line_item ->> 'subtotal')::numeric AS item_subtotal,
    line_item ->> 'productId' AS product_id,
    data -> 'billingAddress' ->> 'city' AS billing_city,
    data -> 'billingAddress' ->> 'state' AS billing_state,
    data -> 'billingAddress' ->> 'street' AS billing_street,
    data -> 'billingAddress' ->> 'zipCode' AS billing_zip,
    data -> 'shippingAddress' ->> 'city' AS shipping_city,
    data -> 'shippingAddress' ->> 'state' AS shipping_state,
    data -> 'shippingAddress' ->> 'street' AS shipping_street,
    data -> 'shippingAddress' ->> 'zipCode' AS shipping_zip
FROM test_db.orders,
     jsonb_array_elements(data -> 'lineItems') AS line_item;
