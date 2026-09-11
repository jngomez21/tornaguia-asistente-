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
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Catalogos;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Infrastructure.Bodegas;
using TornaguiaAsistente.Application.Ia;
using TornaguiaAsistente.Infrastructure.Ia;
using TornaguiaAsistente.Application.Asistente;
using TornaguiaAsistente.Infrastructure.Asistente;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Gerencial;


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
              .AllowAnyMethod()
              // Content-Disposition no está en la lista segura de CORS por defecto: sin esto, el
              // nombre de archivo real del documento de una declaración es invisible para el
              // frontend (solo lo ve el navegador al descargar directo, no vía fetch/axios).
              .WithExposedHeaders("Content-Disposition");
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
builder.Services.AddScoped<ICasoUsoGuardarDetalleTornaguia, CasoUsoGuardarDetalleTornaguia>();
builder.Services.AddScoped<ICasoUsoObtenerHistorialSolicitudes, CasoUsoObtenerHistorialSolicitudes>();
builder.Services.AddScoped<ICasoUsoGuardarPdfTornaguia, CasoUsoGuardarPdfTornaguia>();
builder.Services.AddScoped<ICasoUsoObtenerPdfTornaguia, CasoUsoObtenerPdfTornaguia>();
builder.Services.AddScoped<ICasoUsoObtenerSolicitud, CasoUsoObtenerSolicitud>();
builder.Services.AddScoped<ICasoUsoRegistrarUsuario, CasoUsoRegistrarUsuario>();
builder.Services.AddScoped<ICasoUsoLogin, CasoUsoLogin>();
builder.Services.AddScoped<ICasoUsoObtenerPreguntaSeguridad, CasoUsoObtenerPreguntaSeguridad>();
builder.Services.AddScoped<ICasoUsoRestaurarPassword, CasoUsoRestaurarPassword>();
builder.Services.AddScoped<ICasoUsoObtenerInventario, CasoUsoObtenerInventario>();
builder.Services.AddScoped<ICasoUsoRegistrarEntrada, CasoUsoRegistrarEntrada>();
builder.Services.AddScoped<ICasoUsoListarLotesDisponibles, CasoUsoListarLotesDisponibles>();
builder.Services.AddScoped<ICasoUsoCrearLote, CasoUsoCrearLote>();
builder.Services.AddScoped<ICasoUsoEditarLote, CasoUsoEditarLote>();
builder.Services.AddScoped<ICasoUsoCancelarLote, CasoUsoCancelarLote>();
builder.Services.AddScoped<ICasoUsoEditarInventario, CasoUsoEditarInventario>();
builder.Services.AddScoped<ICasoUsoObtenerResumenImpuestoConsumo, CasoUsoObtenerResumenImpuestoConsumo>();
builder.Services.AddScoped<ICasoUsoObtenerImpuestoPorProducto, CasoUsoObtenerImpuestoPorProducto>();
builder.Services.AddScoped<ICasoUsoListarMunicipios, CasoUsoListarMunicipios>();
builder.Services.AddScoped<ICasoUsoListarPaises, CasoUsoListarPaises>();
builder.Services.AddScoped<ICasoUsoListarDepartamentos, CasoUsoListarDepartamentos>();
builder.Services.AddScoped<ICasoUsoObtenerLimitesDepartamentos, CasoUsoObtenerLimitesDepartamentos>();
builder.Services.AddScoped<ICasoUsoListarProductos, CasoUsoListarProductos>();
builder.Services.AddScoped<ICasoUsoCrearProducto, CasoUsoCrearProducto>();
builder.Services.AddScoped<ICasoUsoListarBodegas, CasoUsoListarBodegas>();
builder.Services.AddScoped<ICasoUsoCrearBodega, CasoUsoCrearBodega>();
builder.Services.AddScoped<ICasoUsoEditarBodega, CasoUsoEditarBodega>();
builder.Services.AddScoped<ICasoUsoEliminarBodega, CasoUsoEliminarBodega>();
builder.Services.AddHttpClient<ExtractorDeclaracionGemini>();
builder.Services.AddScoped<IExtractorDeclaracion, ExtractorDeclaracionGemini>();
builder.Services.AddScoped<ICasoUsoProponerDeclaracion, CasoUsoProponerDeclaracion>();
builder.Services.AddScoped<ICasoUsoCrearLoteDesdeDeclaracion, CasoUsoCrearLoteDesdeDeclaracion>();
builder.Services.AddHttpClient<ClienteChatGroq>();
builder.Services.AddScoped<ICasoUsoResponderPregunta, CasoUsoResponderPreguntaGroq>();
builder.Services.AddScoped<ICasoUsoObtenerHistorialConversacion, CasoUsoObtenerHistorialConversacion>();
builder.Services.AddScoped<ICasoUsoResponderPreguntaGerencial, CasoUsoResponderPreguntaGerencialGroq>();
builder.Services.AddScoped<ICasoUsoObtenerResumenGerencial, CasoUsoObtenerResumenGerencial>();
builder.Services.AddScoped<ICasoUsoObtenerSerieMensual, CasoUsoObtenerSerieMensual>();
builder.Services.AddScoped<ICasoUsoObtenerDistribucionPorTipo, CasoUsoObtenerDistribucionPorTipo>();
builder.Services.AddScoped<ICasoUsoObtenerVolumenPorDepartamento, CasoUsoObtenerVolumenPorDepartamento>();
builder.Services.AddScoped<ICasoUsoObtenerTopProductos, CasoUsoObtenerTopProductos>();
builder.Services.AddScoped<ICasoUsoObtenerTopRutas, CasoUsoObtenerTopRutas>();
builder.Services.AddScoped<ICasoUsoListarContribuyentes, CasoUsoListarContribuyentes>();
builder.Services.AddScoped<ICasoUsoObtenerResumenContribuyente, CasoUsoObtenerResumenContribuyente>();
builder.Services.AddScoped<ICasoUsoContarSolicitudes, CasoUsoContarSolicitudes>();
builder.Services.AddScoped<ICasoUsoListarSolicitudesGerencial, CasoUsoListarSolicitudes>();
builder.Services.AddScoped<ICasoUsoObtenerSolicitudDetalleGerencial, CasoUsoObtenerSolicitudDetalle>();
builder.Services.AddScoped<ICasoUsoListarLotesGerencial, CasoUsoListarLotesGerencial>();
builder.Services.AddScoped<ICasoUsoListarDeclaraciones, CasoUsoListarDeclaraciones>();
builder.Services.AddScoped<ICasoUsoObtenerDocumentoDeclaracion, CasoUsoObtenerDocumentoDeclaracion>();

builder.Services.AddDbContext<TornaguiaDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"), 
        npgsqlOptions => npgsqlOptions.UseNetTopologySuite()));

    builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 60;
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            RoleClaimType = "rol"
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
