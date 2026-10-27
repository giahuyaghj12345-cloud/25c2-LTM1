USE [Quanlysanpham];
GO
-- User demo theo vai trò (mật khẩu giống Huy: Huy9112)
DECLARE @hash NVARCHAR(255) = (SELECT TOP 1 password FROM dbo.users WHERE username = N'Huy');
IF @hash IS NULL SET @hash = N'$2b$10$quZDAsUl4QIvG0K3RJqRL.GJkac8C28m60GStRE/Bgc7a.KjFu6qa';

MERGE dbo.users AS t
USING (VALUES
  (N'kho',   N'kho@demo.local',   N'warehouse', 1),
  (N'bh',    N'bh@demo.local',    N'warranty',  0),
  (N'ban',   N'ban@demo.local',   N'sales',     0)
) AS s(username, email, role, canSerial)
ON t.username = s.username
WHEN MATCHED THEN UPDATE SET
  role = s.role,
  canCreateSerial = s.canSerial,
  status = N'active',
  password = @hash,
  updatedAt = GETDATE()
WHEN NOT MATCHED THEN INSERT (id, username, email, password, role, status, canCreateSerial, createdAt, updatedAt)
  VALUES (NEWID(), s.username, s.email, @hash, s.role, N'active', s.canSerial, GETDATE(), GETDATE());
GO

SELECT username, role, canCreateSerial, status FROM dbo.users ORDER BY role, username;
GO
