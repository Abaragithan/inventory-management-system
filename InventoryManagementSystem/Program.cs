using FluentValidation;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Helpers;
using InventoryManagementSystem.Middleware;
using InventoryManagementSystem.Services;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Controllers - configure JSON to handle enums as strings
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// CORS CONFIGURATION
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));

// JWT CONFIGURATION
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        builder.Configuration["Jwt:Key"]))
            };
    });

builder.Services.AddAuthorization();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// FluentValidation
builder.Services
    .AddValidatorsFromAssemblyContaining<Program>();

// Dependency Injection
builder.Services.AddScoped<
    IPurchaseRequestService,
    PurchaseRequestService>();

builder.Services.AddScoped<
    IProductService,
    ProductService>();

builder.Services.AddScoped<
    ICategoryService,
    CategoryService>();

builder.Services.AddScoped<
    ISupplierService,
    SupplierService>();

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddHttpClient<IEmailService, BrevoEmailService>();



builder.Services.AddScoped<
    IUserService,
    UserService>();

builder.Services.AddScoped<
    IStockTransactionService,
    StockTransactionService>();

builder.Services.AddScoped<
    IDashboardService,
    DashboardService>();

builder.Services.AddScoped<
    IReportService,
    ReportService>();

builder.Services.AddScoped<
    JwtTokenGenerator>();

var app = builder.Build();

// Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();