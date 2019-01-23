# Pizza Delivery RESTful API

Node.js API for a pizza-delivery company, with Stripe and Mailgun integrration without any NPM packages.

1. New users can be created, their information can be edited, and they can be deleted. Fields are First Name, Last Name, Email, Street Address.
2. Users can log in and log out by creating or destroying a token.
3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system).
4. A logged-in user should be able to fill a shopping cart with menu items
5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment.
6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this.

# Project setup
1. Once you have downloaded this code, you need to supply some of your information.
2. You need to create Stripe account to use the Stripe sandbox. Edit the file config.js and put your Stripe API credentials. 
3. You need to create a Mailgun account to use the Mailgun sandbox. Edit the file config.js and put your Mailgun API credentials. 

# API Testing with POSTMAN
## Users
#### Create User POST / localhost:3000/users 
* Body: 
{ "name" : "John", "email" : "john@xyz.com", "address" : "park avenue", "password" : "helloword"}

#### Query User GET / locahost:3000/users?email=john@xyuz.com 
* Headers : 
{ token : "v4hma22teaxyji8ncsei"} - Token can be generated  using tokens/ POST.

#### Delete User DELETE / locahost:3000/users?email=john@xyuz.com 
* Headers : { token : "v4hma22teaxyji8ncsei"} - Token can be generated  using tokens/ POST.

#### Update User PUT / localhost:3000/users 
* Body : 
{ "email" : "Johnny", //optional "email" : "john@xyz.com", //mandatory "address" : "royal park avenue", //optional "password" : "hellomyword" //optional}
* Headers : { token : "v4hma22teaxyji8ncsei"}  - Token can be generated  using tokens/ POST.

## Tokens
Token is generated when user is logged in, Token is required when performing actions like users/get

#### Create connection token POST / localhost:3000/tokens 
* Body : 
{ "email" : "john@xyz.com", "password" : "helloword" } 
* Response: { "email": "john@xyz.com", "id": "2sdnomkcakh1jcjd6o4w"}

#### Query token GET / locahost:3000/tokens?token=2sdnomkcakh1jcjd6o4w 
Response: { "email": "john@xyz.com", "id": "2sdnomkcakh1jcjd6o4w"}

#### Delete token DELETE / locahost:3000/tokens?token=2sdnomkcakh1jcjd6o4w

## Menu
1. The restaurant's menu is located: .data/menu/menu.json, which consists of name and price of each dish offers in the menu.
2. You can use GET / localhost:3000/menu to retrieve the menu, with a token in the header.

## Order
#### Create Order POST / localhost:3000/orders 
* Body : {"orders": [{"dishName": "cde"},{"dishName": "abc"}]} 
* Headers : { token : "v4hma22teaxyji8ncsei"} - Token can be generated  using tokens/ POST.
* Response: {
                      'orderId': "3dslk395kdlspalkdjfj",
                      'email': "john@xyz.com",
                      'orders': dishOrders,
                      'totalPrice': totalPrice,
                      'paymentStatus': "Not submitted",
                      'createdAt': Date.now(),
                      'updatedAt': Date.now()
                    }

#### Query Menu GET / localhost:3000/orders?id=8wa0w48hfa4mszs1gv1r 
* Headers : { token : "v4hma22teaxyji8ncsei"} - Token can be generated  using tokens/ POST. 
* Response: {
                'orderId': "3dslk395kdlspalkdjfj",
                'email': "john@xyz.com",
                'orders': dishOrders,
                'totalPrice': totalPrice,
                'paymentStatus': "Not submitted",
                'createdAt': Date.now(),
                'updatedAt': Date.now()
              }

#### PUT / localhost:3000/orders 
* Headers : { token : "v4hma22teaxyji8ncsei"}  - Token can be generated  using tokens/ POST. 
* Body : { "orderId": "8wa0w48hfa4mszs1gv1r", "orders": [{"dishName": "cde"},{"dishName": "abc"}]}

#### DELETE / localhost:3000/orders?orderId=8wa0w48hfa4mszs1gv1r 
* Headers : { token : "v4hma22teaxyji8ncsei"}  - Token can be generated  using tokens/ POST.

## Payment
#### POST / localhost:3000/payment 
* Headers : { token : "v4hma22teaxyji8ncsei"}  - Token can be generated  using tokens/ POST. 
* Body : { "orderId": "8wa0w48hfa4mszs1gv1r", "card": either "tok_visa" or "tok_mastercard"}
* If payment is successful, you should receive a call back stating "payment successful
* Then, the system will send an email to the user email address. If email is sent successfully, a success message should appear in the console.
