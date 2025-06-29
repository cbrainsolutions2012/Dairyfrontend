create database temple;
use temple;
-- 1. User Registration Table
CREATE TABLE Registration (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    IsAdmin BOOLEAN NOT NULL DEFAULT FALSE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Gotra Type
CREATE TABLE Gotra_Type (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    GotraName VARCHAR(100) NOT NULL,
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 3. Seva Type
CREATE TABLE Seva_Type (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    SevaName VARCHAR(150) NOT NULL,
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 4. Temple Registration
CREATE TABLE Temple_Reg (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    TempleName VARCHAR(150) NOT NULL,
    MobileNo VARCHAR(15),
    City VARCHAR(100),
    RegNumber VARCHAR(50),
    Website VARCHAR(150),
    OwnerName VARCHAR(100),
    EmailId VARCHAR(150),
    Pancard VARCHAR(20),
    GSTNumber VARCHAR(20),
    Address TEXT,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE
);

-- 5. Counter Registration
CREATE TABLE Counter_Reg (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CounterName VARCHAR(100),
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 6. Counter Type
CREATE TABLE Counter_Type (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CounterNumber VARCHAR(50),
    EmpName VARCHAR(100),
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 7. Employee Table
CREATE TABLE tbl_Employee (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(150) NOT NULL,
    MobileNumber VARCHAR(15),
    Pancard VARCHAR(20),
    Adharcard VARCHAR(20),
    Dob DATE,
    EmailId VARCHAR(150),
    City VARCHAR(100),
    Address TEXT,
    WorkingArea ENUM('kitchen', 'accountant', 'peon', 'driver', 'other'),
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id) ON DELETE CASCADE
);

-- 8. Dengidar Registration
CREATE TABLE tbl_Dengidar_Reg (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(150) NOT NULL,
    MobileNumber VARCHAR(15) NOT NULL UNIQUE,
    PanCard VARCHAR(20),
    AdharCard VARCHAR(20),
    GotraTypeId INT,
    City VARCHAR(100),
    Address TEXT,
    EmailId VARCHAR(150),
    DOB DATE,
    RegisterDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (GotraTypeId) REFERENCES Gotra_Type(Id),
    FOREIGN KEY (UserId) REFERENCES Registration(Id) ON DELETE CASCADE
);

-- 9. Dengidar Receipt
CREATE TABLE tbl_DReceipt (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    DengidarId INT NOT NULL,
    ReceiptNumber INT UNIQUE,
    SevaTypeId INT,
    SevaFor VARCHAR(100),
    SevaDate DATE,
    PaymentType VARCHAR(50),
    BankName VARCHAR(100),
    DDNo VARCHAR(50),
    ChequeNo VARCHAR(50),
    Amount DECIMAL(10,2) NOT NULL,
    Note TEXT,
    TransactionId VARCHAR(100),
    UserId INT NOT NULL,
    CounterName VARCHAR(100),
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (DengidarId) REFERENCES tbl_Dengidar_Reg(Id),
    FOREIGN KEY (SevaTypeId) REFERENCES Seva_Type(Id),
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 10. GoSeva
CREATE TABLE goSeva (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    DonationFrequencyMonth INT NOT NULL,
    RegDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(10,2) NOT NULL,
    UserId INT NOT NULL,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserId) REFERENCES Registration(Id)
);

-- 11. GoSeva Receipt
CREATE TABLE goSeva_Receipt (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReceiptNo INT UNIQUE,
    DonarName VARCHAR(150),
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    GoSevaId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    BankName VARCHAR(100),
    PaymentType VARCHAR(50),
    CreatedBy INT,
    FOREIGN KEY (GoSevaId) REFERENCES goSeva(Id)
);

-- 12. Expenses
CREATE TABLE Expanse (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ExpName VARCHAR(100),
    Amount DECIMAL(10,2),
    BankName VARCHAR(100),
    Date DATE,
    Note TEXT,
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE
);

-- 13. Current Account
CREATE TABLE Current_Account (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Date DATE NOT NULL,
    BankName VARCHAR(100),
    AccountNumber VARCHAR(50),
    Amount DECIMAL(10,2) NOT NULL,
    AmountType ENUM('debit', 'credit') NOT NULL,
    PartyName VARCHAR(100),
    PaymentAction VARCHAR(50),
    CreatedBy INT,
    IsDeleted BOOLEAN DEFAULT FALSE
);
