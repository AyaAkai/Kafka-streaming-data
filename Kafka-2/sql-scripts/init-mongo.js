// // show dbs
use test_db
// show collections
db.users.find();
db.orders.find();
rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "mongodb:27017" }]
})
rs.status()

use config
db.createCollection("image_collection")
// Users Collection
db.users.insertMany([
    {
        _id: ObjectId("60d21b4667d0d8992e610c85"),
        name: "John Smith",
        email: "john.smith@example.com",
        address: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        phone: "617-555-1234",
        registeredDate: ISODate("2022-01-15T10:30:00Z"),
        latestOrders: [
            { orderId: ObjectId("60d21b4667d0d8992e610c90"), date: ISODate("2023-04-05T14:30:00Z"), total: 142.50 },
            { orderId: ObjectId("60d21b4667d0d8992e610c91"), date: ISODate("2023-03-22T09:15:00Z"), total: 89.97 },
            { orderId: ObjectId("60d21b4667d0d8992e610c92"), date: ISODate("2023-02-18T16:45:00Z"), total: 215.20 }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c86"),
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        address: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        phone: "415-555-6789",
        registeredDate: ISODate("2022-03-22T08:45:00Z"),
        latestOrders: [
            { orderId: ObjectId("60d21b4667d0d8992e610c93"), date: ISODate("2023-04-10T11:20:00Z"), total: 67.99 },
            { orderId: ObjectId("60d21b4667d0d8992e610c94"), date: ISODate("2023-03-28T13:50:00Z"), total: 154.75 },
            { orderId: ObjectId("60d21b4667d0d8992e610c95"), date: ISODate("2023-03-15T10:30:00Z"), total: 43.25 }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c87"),
        name: "Michael Chen",
        email: "michael.c@example.com",
        address: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        phone: "206-555-4321",
        registeredDate: ISODate("2022-05-17T15:20:00Z"),
        latestOrders: [
            { orderId: ObjectId("60d21b4667d0d8992e610c96"), date: ISODate("2023-04-12T09:45:00Z"), total: 212.40 },
            { orderId: ObjectId("60d21b4667d0d8992e610c97"), date: ISODate("2023-04-01T14:30:00Z"), total: 76.85 },
            { orderId: ObjectId("60d21b4667d0d8992e610c98"), date: ISODate("2023-03-22T17:10:00Z"), total: 129.99 }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c88"),
        name: "Emily Davis",
        email: "emily.davis@example.com",
        address: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        phone: "512-555-8765",
        registeredDate: ISODate("2022-07-09T12:10:00Z"),
        latestOrders: [
            { orderId: ObjectId("60d21b4667d0d8992e610c99"), date: ISODate("2023-04-15T10:15:00Z"), total: 89.95 },
            { orderId: ObjectId("60d21b4667d0d8992e610c9a"), date: ISODate("2023-04-05T16:40:00Z"), total: 132.50 },
            { orderId: ObjectId("60d21b4667d0d8992e610c9b"), date: ISODate("2023-03-25T11:30:00Z"), total: 67.25 }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c89"),
        name: "David Wilson",
        email: "david.w@example.com",
        address: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        phone: "312-555-2345",
        registeredDate: ISODate("2022-09-30T09:50:00Z"),
        latestOrders: [
            { orderId: ObjectId("60d21b4667d0d8992e610c9c"), date: ISODate("2023-04-14T15:25:00Z"), total: 245.75 },
            { orderId: ObjectId("60d21b4667d0d8992e610c9d"), date: ISODate("2023-04-02T12:10:00Z"), total: 76.30 },
            { orderId: ObjectId("60d21b4667d0d8992e610c9e"), date: ISODate("2023-03-20T09:45:00Z"), total: 112.85 }
        ]
    }
]);

// Create a column validation rule for the price and subtotal fields to be of type double
db.runCommand({
    collMod: "orders",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["lineItems"],
            properties: {
                lineItems: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["price", "subtotal"],
                        properties: {
                            price: { bsonType: "double" },
                            subtotal: { bsonType: "double" }
                        }
                    }
                }
            }
        }
    },
    validationAction: "error" // rejects non-compliant inserts/updates
});

// Orders Collection
db.orders.insertMany([
    {
        _id: ObjectId("60d21b4667d0d8992e610c90"),
        userId: ObjectId("60d21b4667d0d8992e610c85"),
        orderDate: ISODate("2023-04-05T14:30:00Z"),
        shippingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        billingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 142.50,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610ca1"),
                name: "Wireless Headphones",
                price: 89.99,
                quantity: 1,
                subtotal: 89.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610ca2"),
                name: "Smartphone Case",
                price: 24.99,
                quantity: 2,
                subtotal: 49.98
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610ca3"),
                name: "Screen Protector",
                price: 2.53,
                quantity: 1,
                subtotal: 2.53
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c91"),
        userId: ObjectId("60d21b4667d0d8992e610c85"),
        orderDate: ISODate("2023-03-22T09:15:00Z"),
        shippingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        billingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        paymentMethod: "PayPal",
        status: "Delivered",
        totalAmount: 89.97,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610ca4"),
                name: "Bluetooth Speaker",
                price: 59.99,
                quantity: 1,
                subtotal: 59.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610ca5"),
                name: "USB Cable",
                price: 9.99,
                quantity: 3,
                subtotal: 29.97
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c92"),
        userId: ObjectId("60d21b4667d0d8992e610c85"),
        orderDate: ISODate("2023-02-18T16:45:00Z"),
        shippingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        billingAddress: {
            street: "123 Main St",
            city: "Boston",
            state: "MA",
            zipCode: "02108"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 215.20,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610ca6"),
                name: "External Hard Drive",
                price: 129.99,
                quantity: 1,
                subtotal: 129.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610ca7"),
                name: "Wireless Mouse",
                price: 45.99,
                quantity: 1,
                subtotal: 45.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610ca8"),
                name: "Mouse Pad",
                price: 12.99,
                quantity: 3,
                subtotal: 38.97
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c93"),
        userId: ObjectId("60d21b4667d0d8992e610c86"),
        orderDate: ISODate("2023-04-10T11:20:00Z"),
        shippingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        billingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        paymentMethod: "Credit Card",
        status: "Shipped",
        totalAmount: 67.99,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610ca9"),
                name: "Yoga Mat",
                price: 29.99,
                quantity: 1,
                subtotal: 29.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610caa"),
                name: "Water Bottle",
                price: parseFloat("19.10"),
                quantity: 2,
                subtotal: parseFloat("38.10")
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c94"),
        userId: ObjectId("60d21b4667d0d8992e610c86"),
        orderDate: ISODate("2023-03-28T13:50:00Z"),
        shippingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        billingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        paymentMethod: "PayPal",
        status: "Delivered",
        totalAmount: 154.75,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cab"),
                name: "Running Shoes",
                price: 129.99,
                quantity: 1,
                subtotal: 129.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cac"),
                name: "Fitness Tracker",
                price: 24.76,
                quantity: 1,
                subtotal: 24.76
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c95"),
        userId: ObjectId("60d21b4667d0d8992e610c86"),
        orderDate: ISODate("2023-03-15T10:30:00Z"),
        shippingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        billingAddress: {
            street: "456 Oak Avenue",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 43.25,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cad"),
                name: "Protein Powder",
                price: 29.99,
                quantity: 1,
                subtotal: 29.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cae"),
                name: "Resistance Bands",
                price: 13.26,
                quantity: 1,
                subtotal: 13.26
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c96"),
        userId: ObjectId("60d21b4667d0d8992e610c87"),
        orderDate: ISODate("2023-04-12T09:45:00Z"),
        shippingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        billingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        paymentMethod: "Credit Card",
        status: "Processing",
        totalAmount: 212.40,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610caf"),
                name: "Coffee Maker",
                price: 149.99,
                quantity: 1,
                subtotal: 149.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb0"),
                name: "Coffee Beans",
                price: 15.99,
                quantity: 2,
                subtotal: 31.98
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb1"),
                name: "Coffee Mug",
                price: 10.15,
                quantity: 3,
                subtotal: 30.45
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c97"),
        userId: ObjectId("60d21b4667d0d8992e610c87"),
        orderDate: ISODate("2023-04-01T14:30:00Z"),
        shippingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        billingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        paymentMethod: "PayPal",
        status: "Delivered",
        totalAmount: 76.85,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cb2"),
                name: "Electric Kettle",
                price: 42.99,
                quantity: 1,
                subtotal: 42.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb3"),
                name: "Tea Sampler",
                price: 16.95,
                quantity: 2,
                subtotal: 33.90
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c98"),
        userId: ObjectId("60d21b4667d0d8992e610c87"),
        orderDate: ISODate("2023-03-22T17:10:00Z"),
        shippingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        billingAddress: {
            street: "789 Pine Road",
            city: "Seattle",
            state: "WA",
            zipCode: "98101"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 129.99,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cb4"),
                name: "Bluetooth Earbuds",
                price: 129.99,
                quantity: 1,
                subtotal: 129.99
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c99"),
        userId: ObjectId("60d21b4667d0d8992e610c88"),
        orderDate: ISODate("2023-04-15T10:15:00Z"),
        shippingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        billingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        paymentMethod: "Credit Card",
        status: "Processing",
        totalAmount: 89.95,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cb5"),
                name: "Desk Lamp",
                price: 45.99,
                quantity: 1,
                subtotal: 45.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb6"),
                name: "Notebook Set",
                price: 14.99,
                quantity: 1,
                subtotal: 14.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb7"),
                name: "Pen Set",
                price: 9.99,
                quantity: 2,
                subtotal: 19.98
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cb8"),
                name: "Desk Organizer",
                price: 8.99,
                quantity: 1,
                subtotal: 8.99
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c9a"),
        userId: ObjectId("60d21b4667d0d8992e610c88"),
        orderDate: ISODate("2023-04-05T16:40:00Z"),
        shippingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        billingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        paymentMethod: "PayPal",
        status: "Shipped",
        totalAmount: 132.50,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cb9"),
                name: "Monitor Stand",
                price: 79.99,
                quantity: 1,
                subtotal: 79.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cba"),
                name: "Wireless Keyboard",
                price: 52.51,
                quantity: 1,
                subtotal: 52.51
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c9b"),
        userId: ObjectId("60d21b4667d0d8992e610c88"),
        orderDate: ISODate("2023-03-25T11:30:00Z"),
        shippingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        billingAddress: {
            street: "321 Maple Drive",
            city: "Austin",
            state: "TX",
            zipCode: "78701"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 67.25,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cbb"),
                name: "USB Hub",
                price: 32.99,
                quantity: 1,
                subtotal: 32.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cbc"),
                name: "Mouse Pad",
                price: 12.99,
                quantity: 1,
                subtotal: 12.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cbd"),
                name: "Cable Organizer",
                price: 7.09,
                quantity: 3,
                subtotal: 21.27
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c9c"),
        userId: ObjectId("60d21b4667d0d8992e610c89"),
        orderDate: ISODate("2023-04-14T15:25:00Z"),
        shippingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        billingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        paymentMethod: "Credit Card",
        status: "Processing",
        totalAmount: 245.75,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cbe"),
                name: "Gaming Console",
                price: 199.99,
                quantity: 1,
                subtotal: 199.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cbf"),
                name: "Game Controller",
                price: 45.76,
                quantity: 1,
                subtotal: 45.76
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c9d"),
        userId: ObjectId("60d21b4667d0d8992e610c89"),
        orderDate: ISODate("2023-04-02T12:10:00Z"),
        shippingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        billingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        paymentMethod: "PayPal",
        status: "Delivered",
        totalAmount: 76.30,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cc0"),
                name: "Video Game",
                price: 59.99,
                quantity: 1,
                subtotal: 59.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cc1"),
                name: "Game Guide Book",
                price: 16.31,
                quantity: 1,
                subtotal: 16.31
            }
        ]
    },
    {
        _id: ObjectId("60d21b4667d0d8992e610c9e"),
        userId: ObjectId("60d21b4667d0d8992e610c89"),
        orderDate: ISODate("2023-03-20T09:45:00Z"),
        shippingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        billingAddress: {
            street: "567 Cedar Lane",
            city: "Chicago",
            state: "IL",
            zipCode: "60601"
        },
        paymentMethod: "Credit Card",
        status: "Delivered",
        totalAmount: 112.85,
        lineItems: [
            {
                productId: ObjectId("60d21b4667d0d8992e610cc2"),
                name: "Gaming Headset",
                price: 79.99,
                quantity: 1,
                subtotal: 79.99
            },
            {
                productId: ObjectId("60d21b4667d0d8992e610cc3"),
                name: "Mouse Pad",
                price: 16.43,
                quantity: 2,
                subtotal: 32.86
            }
        ]
    }
]);