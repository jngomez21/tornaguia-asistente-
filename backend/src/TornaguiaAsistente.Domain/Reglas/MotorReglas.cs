namespace TornaguiaAsistente.Domain.Reglas;

public class MotorReglas : IMotorReglas
{
    public ResultadoEvaluacion Determinar(EvaluacionSolicitud datos)
    {
        if (datos.EsParaExportacion)
        {
            return new ResultadoEvaluacion(
                "Tránsito",
                "El traslado tiene como propósito la exportación.");
        }

        if (datos.MismoDepartamento)
        {
            return new ResultadoEvaluacion(
                "Tránsito",
                "El origen y el destino se encuentran dentro del mismo departamento.");
        }

        if (datos.EstaDeclarado)
        {
            return new ResultadoEvaluacion(
                "Reenvío",
                "El origen y el destino están en departamentos distintos, y el producto ya fue declarado en el departamento de origen.");
        }

        return new ResultadoEvaluacion(
            "Movilización",
            "El origen y el destino están en departamentos distintos, y el producto no está declarado.");
    }
}