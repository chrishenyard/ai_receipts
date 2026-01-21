#!/bin/bash

DB_PATH="/app/db/receipts.db"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Database does not exist. Creating $DB_PATH..."
    
    # Create the database and tables
    sqlite3 "$DB_PATH" <<EOF
-- Create Category table
CREATE TABLE IF NOT EXISTS Category (
    CategoryId INTEGER PRIMARY KEY,
    Name TEXT NOT NULL CHECK(length(Name) <= 100)
);

-- Create Receipt table
CREATE TABLE IF NOT EXISTS Receipt (
    ReceiptId INTEGER PRIMARY KEY AUTOINCREMENT,
    ExtractedText TEXT NOT NULL CHECK(length(ExtractedText) <= 4096),
    Title TEXT NOT NULL CHECK(length(Title) <= 100),
    Description TEXT NOT NULL CHECK(length(Description) <= 4096),
    Vendor TEXT NOT NULL CHECK(length(Vendor) <= 100),
    State TEXT NOT NULL CHECK(length(State) <= 100),
    City TEXT NOT NULL CHECK(length(City) <= 100),
    Country TEXT NOT NULL CHECK(length(Country) <= 100),
    ImageUrl TEXT NOT NULL CHECK(length(ImageUrl) <= 500),
    Tax REAL NOT NULL CHECK(Tax >= 1),
    Total REAL NOT NULL CHECK(Total >= 1),
    PurchaseDate TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    CategoryId INTEGER NOT NULL,
    FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipt_category ON Receipt(CategoryId);
CREATE INDEX IF NOT EXISTS idx_receipt_purchase_date ON Receipt(PurchaseDate);
CREATE INDEX IF NOT EXISTS idx_receipt_vendor ON Receipt(Vendor);

INSERT  INTO Category (CategoryId, Name)
    SELECT 1, 'Childcare'
    UNION ALL SELECT 2, 'Clothing'
    UNION ALL SELECT 3, 'Debt'
    UNION ALL SELECT 4, 'Donations'
    UNION ALL SELECT 5, 'Education'
    UNION ALL SELECT 6, 'Entertainment'
    UNION ALL SELECT 7, 'Financial'
    UNION ALL SELECT 8, 'Food'
    UNION ALL SELECT 9, 'Healthcare'
    UNION ALL SELECT 10, 'Housing'
    UNION ALL SELECT 11, 'Insurance'
    UNION ALL SELECT 12, 'Legal'
    UNION ALL SELECT 13, 'Petcare'
    UNION ALL SELECT 14, 'Transportation'
    UNION ALL SELECT 15, 'Utilities'
WHERE NOT EXISTS (SELECT 1 FROM Category);
EOF
    echo "Database and tables created successfully."
else
    echo "Database already exists at $DB_PATH"
fi

dotnet AI.Receipts.dll
