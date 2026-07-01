
INSERT INTO CUSTOMER (CustomerName, Address, Phone) VALUES
('Tejas Mahamuni', 'Ahilyanagar, Maharashtra', '9322188608'),
('Rushikesh Shinde', 'Ahilyanagar, Maharashtra', '8180917274'),
('Aarav Sharma', 'Mumbai, Maharashtra', '9823011234'),
('Priya Patel', 'Ahmedabad, Gujarat', '9176543210'),
('Rohan Das', 'Kolkata, West Bengal', '9830098765'),
('Ananya Reddy', 'Hyderabad, Telangana', '9440123456'),
('Vikram Singh', 'Jaipur, Rajasthan', '9610234567'),
('Sneha Iyer', 'Chennai, Tamil Nadu', '9840567890'),
('Arjun Verma', 'New Delhi, Delhi', '9810012345'),
('Kavita Rao', 'Bengaluru, Karnataka', '9900123456'),
('Rahul Joshi', 'Pune, Maharashtra', '9371054321'),
('Meera Nair', 'Kochi, Kerala', '9447012345'),
('Amit Mishra', 'Lucknow, Uttar Pradesh', '9415098765');

INSERT INTO VEHICLE(VEHICLENUMBER, VEHICLETYPE, CAPACITY) VALUES
('MH 16 AB 4821', 'Two Wheeler', 50),
('DL 03 CY 8912', 'Four Wheeler', 400),
('KA 51 MJ 2345', 'Two Wheeler', 100),
('TN 22 7012', 'Two Wheeler', 150),
('GJ 01 ZU 5567', 'Four Wheeler', 500),
('HR 26 BQ 9034', 'Heavy Vehicle', 2000),
('UP 32 HA 1122', 'Four Wheeler', 350),
('WB 02 K 6789', 'Two Wheeler', 200),
('TS 09 EQ 4531', 'Two Wheeler', 50),
('MH 12 RS 9988', 'Two Vehicle', 5000),
('KA 03 NV 3412', 'Four Wheeler', 400),
('DL 01 4061', 'Heavy Vehicle', 1200),
('TN 07 JW 8254', 'Two Wheeler', 150),
('UP 16 TX 2399', 'Heavy Vehicle', 5000),
('GJ 05 BC 6112', 'Two Wheeler', 100);

INSERT INTO DRIVER(DRIVERNAME, PHONE, LICENSENUMBER) VALUES
('Ramesh Shinde', '9822145678', 'MH1620210045612'),
('Sunita Sharma', '9158432109', 'DL0320190089123'),
('Aniket Patil', '7709564321', 'MH1220180023456'),
('Deepak Verma', '8888123456', 'UP3220200055678'),
('Rajesh Kumar', '9422078912', 'HR2620170090341'),
('Suresh Deshmukh', '9325112233', 'MH1420220011223'),
('Pooja Joshi', '9637456789', 'KA0320150067890'),
('Manoj Tiwari', '9923887766', 'WB0220160045312'),
('Vikram Jadhav', '7507123456', 'MH1620230099881'),
('Karan Singh', '8411998877', 'GJ0120210034123');

INSERT INTO DISPATCHORDER(CUSTOMERID, SOURCE, DESTINATION) VALUES
(1, 'Mumbai, Maharashtra', 'Ahilyanagar'),
(2, 'Ahmedabad, Gujarat', 'Mumbai, Maharashtra'),
(3, 'Kolkata, West Bengal', 'Pune, Maharashtra'),
(4, 'Hyderabad, Telangana', 'Bengaluru, Karnataka'),
(5, 'Jaipur, Rajasthan', 'New Delhi, Delhi');


INSERT INTO USERS
(USERNAME,PASSWORD,ROLE)
VALUES
('admin','admin123','ADMIN');

INSERT INTO USERS
(USERNAME,PASSWORD,ROLE) 
VALUES
('dispatcher1','disp123','DISPATCHER');

INSERT INTO USERS
(USERNAME,PASSWORD,ROLE)
VALUES
('driver1','driver123','DRIVER');

COMMIT;

drop table vehicle;
drop table driver;
drop table customer;
drop table dispatchorder;
drop table dispatchassignment;
drop table delivery;
