namespace TornaguiaAsistente.Domain.Reglas;

public interface IMotorReglas
{
    ResultadoEvaluacion Determinar(EvaluacionSolicitud datos);
}

public record EvaluacionSolicitud(
    bool EsParaExportacion,
    bool MismoDepartamento,
    bool EstaDeclarado
);

public record ResultadoEvaluacion(string TipoTornaguiaNombre, string Justificacion);