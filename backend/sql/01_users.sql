IF COL_LENGTH('dbo.users', 'phone') IS NULL ALTER TABLE dbo.users ADD phone NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.users', 'address') IS NULL ALTER TABLE dbo.users ADD address NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.users', 'cccd') IS NULL ALTER TABLE dbo.users ADD cccd NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.users', 'avatar') IS NULL ALTER TABLE dbo.users ADD avatar NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.users', 'status') IS NULL ALTER TABLE dbo.users ADD status NVARCHAR(20) NOT NULL CONSTRAINT DF_users_status DEFAULT 'active';
