using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Infrastructure.Persistence;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Infrastructure.Geografia;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Solicitudes;
using TornaguiaAsistente.Domain.Reglas;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddHttpClient<MotorGeograficoMapbox>();
builder.Services.AddScoped<IMotorGeografico, MotorGeograficoConCache>();
builder.Services.AddScoped<IMotorReglas, MotorReglas>();
builder.Services.AddScoped<ICasoUsoCrearSolicitud, CasoUsoCrearSolicitud>();

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRateLimiter();

app.UseAuthorization();

app.MapControllers();

app.Run();
