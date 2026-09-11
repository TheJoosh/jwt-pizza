# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      | home.tsx     |    none           |    none       |
| Register new user<br/>(t@jwt.com, pw: test)         | register.tsx              |  [POST] /api/auth     | `INSERT INTO user (name, email, password) VALUES (?, ?, ?)` <br/>`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`  |
| Login new user<br/>(t@jwt.com, pw: test)            | login.tsx    |[POST] /api/auth | `INSERT INTO auth (token, userID) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`|
| Order pizza                                         | menu.tsx<br/>payment.tsx | [POST] /api/order  |`INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())` <br/>`INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`|
| Verify pizza                                        |delivery.tsx|[POST] /api/order/verify|              |
| View profile page                                   |                    |                   |              |
| View franchise<br/>(as diner)                       |                    |                   |              |
| Logout                                              |                    |                   |              |
| View About page                                     |                    |                   |              |
| View History page                                   |                    |                   |              |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |                    |                   |              |
| View franchise<br/>(as franchisee)                  |                    |                   |              |
| Create a store                                      |                    |                   |              |
| Close a store                                       |                    |                   |              |
| Login as admin<br/>(a@jwt.com, pw: admin)           |                    |                   |              |
| View Admin page                                     |                    |                   |              |
| Create a franchise for t@jwt.com                    |                    |                   |              |
| Close the franchise for t@jwt.com                   |                    |                   |              |
