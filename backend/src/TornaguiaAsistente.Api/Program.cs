using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Infrastructure.Persistence;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Infrastructure.Geografia;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Solicitudes;
using TornaguiaAsistente.Domain.Reglas;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Infrastructure.Autenticacion;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Ingresa el token JWT obtenido en /api/auth/login"
    });

    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        [new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddHttpClient<MotorGeograficoMapbox>();
builder.Services.AddScoped<IMotorGeografico, MotorGeograficoConCache>();
builder.Services.AddScoped<IMotorReglas, MotorReglas>();
builder.Services.AddScoped<ICasoUsoCrearSolicitud, CasoUsoCrearSolicitud>();
builder.Services.AddScoped<ICasoUsoRegistrarUsuario, CasoUsoRegistrarUsuario>();
builder.Services.AddScoped<ICasoUsoLogin, CasoUsoLogin>();

builder.Services.AddDbContext<TornaguiaDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"), 
        npgsqlOptions => npgsqlOptions.UseNetTopologySuite()));

    builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Falta configurar Jwt:SecretKey");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
