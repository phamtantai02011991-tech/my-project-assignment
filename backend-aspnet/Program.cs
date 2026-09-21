using System.Text;
using System.Text.Json;
using EmployeeTransferApi.Data;
using EmployeeTransferApi.Repositories;
using EmployeeTransferApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Port Configuration
builder.WebHost.UseUrls("http://0.0.0.0:5000");

// 2. Register DI Services (Clean Architecture)
builder.Services.AddSingleton<SqliteDbConnection>();
builder.Services.AddSingleton<DatabaseInitializer>();

builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<ITransferRepository, TransferRepository>();
builder.Services.AddScoped<IAuditAndNotificationRepository, AuditAndNotificationRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITransferService, TransferService>();

// Configure Redis Distributed Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? builder.Configuration["Redis:ConnectionString"];
    options.InstanceName = builder.Configuration["Redis:InstanceName"] ?? "EmployeeTransfer_";
});

// 3. Background Scheduler (Runs every 15 seconds)
builder.Services.AddHostedService<TransferSchedulerService>();

// 4. JSON Serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 5. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 6. JWT Authentication
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "workflow_super_secret_jwt_key_2026_dev_team_min_32_bytes!";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = "role",
        NameClaimType = "name"
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// 7. Initialize Database (9 ERD tables & Seed Data)
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    initializer.Initialize();
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// 8. Health Check
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    system = "Employee Transfer Workflow API",
    architecture = "Clean Architecture (.NET 10 Web API + SQLite ACID ST)",
    timestamp = DateTime.UtcNow.ToString("o")
}));

app.MapControllers();

Console.WriteLine("==================================================================");
Console.WriteLine(" 🚀 Employee Transfer Workflow API (ASP.NET Core) Online");
Console.WriteLine(" 🌐 Endpoint: http://0.0.0.0:5000");
Console.WriteLine(" 🔒 Security: JWT RBAC + BCrypt Password Hashing");
Console.WriteLine(" 📊 Database: SQLite with ACID Transaction ST");
Console.WriteLine("==================================================================");

app.Run();
