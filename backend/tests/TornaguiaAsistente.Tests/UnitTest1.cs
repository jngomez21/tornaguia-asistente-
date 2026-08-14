using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Domain.Reglas;
using Xunit;
using Xunit.Abstractions;

namespace TornaguiaAsistente.Tests;

public class MotorReglasTests
{
    private readonly IMotorReglas _motor = new MotorReglas();
    private readonly ITestOutputHelper _output;

    public MotorReglasTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public void Exportacion_SiempreEsTransito_SinImportarLoDemas()
    {
        var datos = new EvaluacionSolicitud(
            EsParaExportacion: true,
            MismoDepartamento: true,
            EstaDeclarado: true);

        var resultado = _motor.Determinar(datos);

        _output.WriteLine($"Resultado: {resultado.TipoTornaguiaNombre}");
        _output.WriteLine($"Justificación: {resultado.Justificacion}");

        Assert.Equal("Tránsito", resultado.TipoTornaguiaNombre);
    }

    [Fact]
    public void MismoDepartamento_SinExportacion_EsTransito()
    {
        var datos = new EvaluacionSolicitud(
            EsParaExportacion: false,
            MismoDepartamento: true,
            EstaDeclarado: true);

        var resultado = _motor.Determinar(datos);

        _output.WriteLine($"Resultado: {resultado.TipoTornaguiaNombre}");
        _output.WriteLine($"Justificación: {resultado.Justificacion}");

        Assert.Equal("Tránsito", resultado.TipoTornaguiaNombre);
    }

    [Fact]
    public void DistintoDepartamento_NoDeclarado_EsMovilizacion()
    {
        var datos = new EvaluacionSolicitud(
            EsParaExportacion: false,
            MismoDepartamento: false,
            EstaDeclarado: false);

        var resultado = _motor.Determinar(datos);

        _output.WriteLine($"Resultado: {resultado.TipoTornaguiaNombre}");
        _output.WriteLine($"Justificación: {resultado.Justificacion}");

        Assert.Equal("Movilización", resultado.TipoTornaguiaNombre);
    }

    [Fact]
    public void DistintoDepartamento_Declarado_EsReenvio()
    {
        var datos = new EvaluacionSolicitud(
            EsParaExportacion: false,
            MismoDepartamento: false,
            EstaDeclarado: true);

        var resultado = _motor.Determinar(datos);

        _output.WriteLine($"Resultado: {resultado.TipoTornaguiaNombre}");
        _output.WriteLine($"Justificación: {resultado.Justificacion}");

        Assert.Equal("Reenvío", resultado.TipoTornaguiaNombre);
    }

    [Fact]
    public void TodoResultado_IncluyeUnaJustificacion()
    {
        var datos = new EvaluacionSolicitud(
            EsParaExportacion: true,
            MismoDepartamento: false,
            EstaDeclarado: true);

        var resultado = _motor.Determinar(datos);

        _output.WriteLine($"Resultado: {resultado.TipoTornaguiaNombre}");
        _output.WriteLine($"Justificación: {resultado.Justificacion}");

        Assert.False(string.IsNullOrWhiteSpace(resultado.Justificacion));
    }
}