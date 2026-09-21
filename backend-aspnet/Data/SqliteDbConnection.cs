using Microsoft.Data.Sqlite;

namespace EmployeeTransferApi.Data;

public class SqliteDbConnection
{
    private readonly string _connectionString;

    public SqliteDbConnection(IConfiguration configuration)
    {
        var rawConn = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=data/database.sqlite";
        _connectionString = rawConn;
        
        var builder = new SqliteConnectionStringBuilder(_connectionString);
        var dbPath = builder.DataSource;
        var dir = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }

    public SqliteConnection CreateConnection()
    {
        var conn = new SqliteConnection(_connectionString);
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;";
        cmd.ExecuteNonQuery();
        return conn;
    }
}
