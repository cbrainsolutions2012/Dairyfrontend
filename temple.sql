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


USE temple;

alter table 
add column 

ALTER TABLE Expanse 
ADD COLUMN PaymentType ENUM('cash', 'cheque', 'dd', 'online', 'card') DEFAULT 'cash',
ADD COLUMN TransactionId VARCHAR(100),
ADD COLUMN ChequeNo VARCHAR(50),
ADD COLUMN DDNo VARCHAR(50),
ADD COLUMN CounterName VARCHAR(100),
ADD COLUMN Category VARCHAR(100),
ADD COLUMN UserId INT NULL,  -- Allow NULL initially
ADD COLUMN Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE Expanse SET UserId = 1 WHERE Id > 0 AND UserId IS NULL;

ALTER TABLE tbl_DReceipt
ADD COLUMN Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE Income (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    IncomeName VARCHAR(100) NOT NULL,        -- Same as ExpName
    Amount DECIMAL(10,2) NOT NULL,
    BankName VARCHAR(100),                   -- Bank name (optional)
    Date DATE NOT NULL,
    PaymentType ENUM('cash', 'cheque', 'dd', 'online', 'card') DEFAULT 'cash',
    TransactionId VARCHAR(100),
    ChequeNo VARCHAR(50),
    DDNo VARCHAR(50),
    CounterName VARCHAR(100),
    Category VARCHAR(100),
    Note TEXT,
    UserId INT NOT NULL,
    CreatedBy INT NOT NULL,
    IsDeleted BOOLEAN DEFAULT FALSE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Registration(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Registration(Id)
);

DROP TABLE IF EXISTS Current_Account;

CREATE TABLE Current_Account (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Date DATE NOT NULL,
    
    -- Transaction details
    TransactionType ENUM('income', 'expense', 'receipt') NOT NULL,
    Description VARCHAR(200) NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    AmountType ENUM('debit', 'credit') NOT NULL,
    
    -- Bank and party info
    BankName VARCHAR(100),                   -- Bank name (can be NULL for cash)
    PartyName VARCHAR(150),                  -- Dengidar name for receipts
    CounterName VARCHAR(100),
    
    -- Reference to source table
    ReferenceId INT NOT NULL,                -- ID from Income/Expanse/tbl_DReceipt
    ReferenceTable VARCHAR(50) NOT NULL,     -- 'Income', 'Expanse', 'tbl_DReceipt'
    
    -- Audit fields
    UserId INT NOT NULL,
    CreatedBy INT NOT NULL,
    IsDeleted BOOLEAN DEFAULT FALSE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserId) REFERENCES Registration(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Registration(Id),
    
    INDEX idx_date (Date),
    INDEX idx_type (TransactionType),
    INDEX idx_bank (BankName)
);

INSERT INTO Current_Account (
    Date, TransactionType, Description, Amount, AmountType,
    BankName, CounterName, ReferenceId, ReferenceTable,
    UserId, CreatedBy
)
SELECT 
    Date,
    'expense' as TransactionType,
    CONCAT('Expense: ', ExpName) as Description,
    Amount,
    'debit' as AmountType,
    BankName,
    CounterName,
    Id as ReferenceId,
    'Expanse' as ReferenceTable,
    UserId,
    UserId as CreatedBy  -- Using UserId as CreatedBy for existing records
FROM Expanse
WHERE IsDeleted = FALSE OR IsDeleted IS NULL;


INSERT INTO Current_Account (
    Date, TransactionType, Description, Amount, AmountType,
    BankName, PartyName, CounterName, ReferenceId, ReferenceTable,
    UserId, CreatedBy
)
SELECT 
    COALESCE(r.SevaDate, CURDATE()) as Date,
    'receipt' as TransactionType,
    CONCAT('Receipt #', r.ReceiptNumber, 
           CASE WHEN r.SevaFor IS NOT NULL THEN CONCAT(' - ', r.SevaFor) ELSE '' END) as Description,
    r.Amount,
    'credit' as AmountType,
    r.BankName,
    COALESCE(d.FullName, 'Unknown') as PartyName,
    r.CounterName,
    r.Id as ReferenceId,
    'tbl_DReceipt' as ReferenceTable,
    COALESCE(r.UserId, 1) as UserId,  -- Default to user 1 if no UserId
    COALESCE(r.CreatedBy, 1) as CreatedBy  -- Default to user 1 if no CreatedBy
FROM tbl_DReceipt r
LEFT JOIN tbl_Dengidar_Reg d ON r.DengidarId = d.Id
WHERE (r.IsDeleted = FALSE OR r.IsDeleted IS NULL);


DELIMITER //

CREATE TRIGGER tr_income_insert 
AFTER INSERT ON Income
FOR EACH ROW
BEGIN
    INSERT INTO Current_Account (
        Date, TransactionType, Description, Amount, AmountType,
        BankName, CounterName, ReferenceId, ReferenceTable,
        UserId, CreatedBy
    ) VALUES (
        NEW.Date,
        'income',
        CONCAT('Income: ', NEW.IncomeName),
        NEW.Amount,
        'credit',                            -- Income = Money IN
        NEW.BankName,
        NEW.CounterName,
        NEW.Id,
        'Income',
        NEW.UserId,
        NEW.CreatedBy
    );
END//

CREATE TRIGGER tr_income_update 
AFTER UPDATE ON Income
FOR EACH ROW
BEGIN
    IF NEW.IsDeleted = FALSE THEN
        -- Update existing entry
        UPDATE Current_Account SET
            Date = NEW.Date,
            Description = CONCAT('Income: ', NEW.IncomeName),
            Amount = NEW.Amount,
            BankName = NEW.BankName,
            CounterName = NEW.CounterName,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'Income' AND ReferenceId = NEW.Id AND IsDeleted = FALSE;
    ELSE
        -- Mark as deleted if income is deleted
        UPDATE Current_Account SET
            IsDeleted = TRUE,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'Income' AND ReferenceId = NEW.Id;
    END IF;
END//


CREATE TRIGGER tr_expense_insert 
AFTER INSERT ON Expanse
FOR EACH ROW
BEGIN
    INSERT INTO Current_Account (
        Date, TransactionType, Description, Amount, AmountType,
        BankName, CounterName, ReferenceId, ReferenceTable,
        UserId, CreatedBy
    ) VALUES (
        NEW.Date,
        'expense',
        CONCAT('Expense: ', NEW.ExpName),
        NEW.Amount,
        'debit',                             -- Expense = Money OUT
        NEW.BankName,
        NEW.CounterName,
        NEW.Id,
        'Expanse',
        NEW.UserId,
        NEW.CreatedBy
    );
END//

CREATE TRIGGER tr_expense_update 
AFTER UPDATE ON Expanse
FOR EACH ROW
BEGIN
    IF NEW.IsDeleted = FALSE THEN
        -- Update existing entry
        UPDATE Current_Account SET
            Date = NEW.Date,
            Description = CONCAT('Expense: ', NEW.ExpName),
            Amount = NEW.Amount,
            BankName = NEW.BankName,
            CounterName = NEW.CounterName,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'Expanse' AND ReferenceId = NEW.Id AND IsDeleted = FALSE;
    ELSE
        -- Mark as deleted if expense is deleted
        UPDATE Current_Account SET
            IsDeleted = TRUE,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'Expanse' AND ReferenceId = NEW.Id;
    END IF;
END//

CREATE TRIGGER tr_receipt_insert 
AFTER INSERT ON tbl_DReceipt
FOR EACH ROW
BEGIN
    DECLARE dengidar_name VARCHAR(150);
    
    -- Get dengidar name
    SELECT FullName INTO dengidar_name 
    FROM tbl_Dengidar_Reg 
    WHERE Id = NEW.DengidarId;
    
    INSERT INTO Current_Account (
        Date, TransactionType, Description, Amount, AmountType,
        BankName, PartyName, CounterName, ReferenceId, ReferenceTable,
        UserId, CreatedBy
    ) VALUES (
        COALESCE(NEW.SevaDate, CURDATE()),
        'receipt',
        CONCAT('Receipt #', NEW.ReceiptNumber, 
               CASE WHEN NEW.SevaFor IS NOT NULL THEN CONCAT(' - ', NEW.SevaFor) ELSE '' END),
        NEW.Amount,
        'credit',                            -- Receipt = Money IN
        NEW.BankName,
        COALESCE(dengidar_name, 'Unknown'),
        NEW.CounterName,
        NEW.Id,
        'tbl_DReceipt',
        COALESCE(NEW.UserId, 1),
        COALESCE(NEW.CreatedBy, 1)
    );
END//

CREATE TRIGGER tr_receipt_update 
AFTER UPDATE ON tbl_DReceipt
FOR EACH ROW
BEGIN
    DECLARE dengidar_name VARCHAR(150);
    
    IF NEW.IsDeleted = FALSE THEN
        -- Get dengidar name
        SELECT FullName INTO dengidar_name 
        FROM tbl_Dengidar_Reg 
        WHERE Id = NEW.DengidarId;
        
        -- Update existing entry
        UPDATE Current_Account SET
            Date = COALESCE(NEW.SevaDate, CURDATE()),
            Description = CONCAT('Receipt #', NEW.ReceiptNumber, 
                       CASE WHEN NEW.SevaFor IS NOT NULL THEN CONCAT(' - ', NEW.SevaFor) ELSE '' END),
            Amount = NEW.Amount,
            BankName = NEW.BankName,
            PartyName = COALESCE(dengidar_name, 'Unknown'),
            CounterName = NEW.CounterName,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'tbl_DReceipt' AND ReferenceId = NEW.Id AND IsDeleted = FALSE;
    ELSE
        -- Mark as deleted if receipt is deleted
        UPDATE Current_Account SET
            IsDeleted = TRUE,
            Updated_At = CURRENT_TIMESTAMP
        WHERE ReferenceTable = 'tbl_DReceipt' AND ReferenceId = NEW.Id;
    END IF;
END//

DROP VIEW IF EXISTS v_daily_summary;
DROP VIEW IF EXISTS v_bank_summary;
DROP VIEW IF EXISTS v_monthly_report;









-- Daily Summary
CREATE VIEW v_daily_summary AS
SELECT 
    Date,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE 0 END) as total_income,
    SUM(CASE WHEN AmountType = 'debit' THEN Amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE -Amount END) as profit_loss,
    COUNT(*) as total_transactions
FROM Current_Account 
WHERE IsDeleted = FALSE
GROUP BY Date
ORDER BY Date DESC;

-- Bank-wise Summary
CREATE VIEW v_bank_summary AS
SELECT 
    COALESCE(BankName, 'Cash') as bank_name,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE 0 END) as money_in,
    SUM(CASE WHEN AmountType = 'debit' THEN Amount ELSE 0 END) as money_out,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE -Amount END) as net_amount,
    COUNT(*) as transaction_count
FROM Current_Account 
WHERE IsDeleted = FALSE
GROUP BY BankName
ORDER BY net_amount DESC;

-- Monthly Profit/Loss
CREATE VIEW v_monthly_report AS
SELECT 
    YEAR(Date) as year,
    MONTH(Date) as month,
    MONTHNAME(Date) as month_name,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE 0 END) as total_income,
    SUM(CASE WHEN AmountType = 'debit' THEN Amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN AmountType = 'credit' THEN Amount ELSE -Amount END) as profit_loss
FROM Current_Account 
WHERE IsDeleted = FALSE
GROUP BY YEAR(Date), MONTH(Date)
ORDER BY year DESC, month DESC;

SELECT 'Migration completed successfully!' as Status;

SELECT 'Checking Expanse table structure...' as Info;

DESCRIBE Expanse;

SELECT 'Checking Income table structure...' as Info;
DESCRIBE Income;

SELECT 'Checking Current_Account table structure...' as Info;
DESCRIBE Current_Account;

-- Show triggers
SELECT 'Checking triggers...' as Info;
SHOW TRIGGERS;

-- Show views
SELECT 'Checking views...' as Info;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Show current account data
SELECT 'Current account records:' as Info;
SELECT COUNT(*) as total_records FROM Current_Account;


use temple;

ALTER TABLE goSeva_Receipt 
ADD COLUMN DengidarId INT NULL AFTER GoSevaId,
ADD COLUMN DurationMonths INT NULL AFTER Amount,
ADD COLUMN StartDate DATE NULL AFTER DurationMonths,
ADD COLUMN EndDate DATE NULL AFTER StartDate,
ADD COLUMN Status ENUM('active', 'expired', 'renewed', 'cancelled') DEFAULT 'active' AFTER EndDate,
ADD COLUMN Note TEXT NULL AFTER PaymentType;


ALTER TABLE goSeva_Receipt 
ADD CONSTRAINT FK_goSeva_Receipt_Dengidar 
FOREIGN KEY (DengidarId) REFERENCES tbl_Dengidar_Reg(Id) 
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_goseva_receipt_status ON goSeva_Receipt(Status);
CREATE INDEX idx_goseva_receipt_enddate ON goSeva_Receipt(EndDate);
CREATE INDEX idx_goseva_receipt_dengidar ON goSeva_Receipt(DengidarId);

UPDATE goSeva_Receipt SET Status = 'active' WHERE Status IS NULL;


CREATE VIEW vw_active_goseva_receipts AS
SELECT 
    gr.*,
    d.FullName as DengidarName,
    d.MobileNumber as DengidarPhone,
    d.Address as DengidarAddress,
    r.Username as CreatedByName,
    DATEDIFF(gr.EndDate, CURDATE()) as DaysUntilExpiry,
    CASE 
        WHEN gr.EndDate IS NULL THEN 'No End Date'
        WHEN gr.EndDate < CURDATE() THEN 'Expired'
        WHEN DATEDIFF(gr.EndDate, CURDATE()) <= 30 THEN 'Expiring Soon'
        ELSE 'Active'
    END as ExpiryStatus
FROM goSeva_Receipt gr
LEFT JOIN tbl_Dengidar_Reg d ON gr.DengidarId = d.Id
LEFT JOIN Registration r ON gr.CreatedBy = r.Id
WHERE gr.Status = 'active';

DELIMITER //
CREATE PROCEDURE UpdateExpiredGoSevaReceipts()
BEGIN
    UPDATE goSeva_Receipt 
    SET Status = 'expired' 
    WHERE Status = 'active' 
    AND EndDate IS NOT NULL 
    AND EndDate < CURDATE();
    
    SELECT ROW_COUNT() as UpdatedRecords;
END //
DELIMITER ;

-- Find the foreign key constraint name
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'goSeva_Receipt' 
AND COLUMN_NAME = 'goSevaId' 
AND CONSTRAINT_SCHEMA = DATABASE();

-- Drop the goSevaId column directly
ALTER TABLE goSeva_Receipt DROP COLUMN goSevaId;

-- Check all constraints on the table
SHOW CREATE TABLE goSeva_Receipt;

-- First, drop the foreign key constraint
ALTER TABLE goSeva_Receipt DROP FOREIGN KEY goSeva_Receipt_ibfk_1;

-- Then, drop the index (if it exists)
ALTER TABLE goSeva_Receipt DROP INDEX GoSevaId;

-- Finally, drop the column
ALTER TABLE goSeva_Receipt DROP COLUMN GoSevaId;