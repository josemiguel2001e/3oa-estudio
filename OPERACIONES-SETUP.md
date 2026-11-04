# 3.OA · Operaciones: puesta en marcha segura

Este cambio **no sustituye** `index.html` ni `felipe.html`. Añade una interfaz mínima y conectable en `operaciones.html`. La agenda vigente seguirá funcionando sin cambios.

## Funciones incorporadas
- Dirección: bandeja de entregas, decisión Sí / No / Tiene observaciones, vista de horas iniciales y reproceso, alta de tareas y biblioteca editable.
- Colaboradores: una actividad prioritaria, iniciar, pausar con motivo obligatorio, reanudar, entregar con enlace HTTPS y descripción, recibir observaciones, volver a entregar.
- Auditoría de sesiones, entregas y revisiones en tablas separadas con sellos de fecha.
- Biblioteca dinámica con rubros provisionales y estimaciones configurables.
- Preparado para más colaboradores mediante roles por usuario.

## Pasos para habilitar operación real
1. Crear un proyecto Supabase (región y cumplimiento adecuados para los datos del estudio).
2. Ejecutar `operaciones-schema.sql` en el editor SQL; revisar primero las políticas de acceso con un desarrollador.
3. Crear usuarios con emails únicos desde Supabase Authentication (deshabilitar registro abierto).
4. Copiar `operaciones-config.example.js` a `operaciones-config.js` y llenar **Project URL** y **anon/publishable key**, jamás service role.
5. Añadir los perfiles con sus Auth UUID reales a `public.profiles`, con rol `director` o `collaborator`.
6. Abrir `operaciones.html` y verificar con dos cuentas distintas el ciclo completo. Solo después enlazarlo en la navegación principal.
7. Importar actividades existentes del cronograma maestro **tras** definir un mapeo que preserve fechas, prioridades y autores. No se ha realizado ninguna migración de datos.

## Pendiente de producción
- Programador de calendario laboral: festivos colombianos, jornadas completas y medias jornadas, permisos, horas extraordinarias y proyecciones.
- Estadísticas avanzadas normalizadas por escala y complejidad: la interfaz actualmente solo muestra **tiempo efectivo y reproceso**. No muestra una eficiencia inferida sin datos suficientes.
- Evidencias: se usan enlaces; no hay almacenamiento de archivos integrado.
- Fortalecer la consistencia transaccional: iniciar, pausar, presentar y revisar usan varias escrituras cliente. Antes de un lanzamiento real, moverlas a funciones SQL transaccionales (RPC) e incorporar pruebas de concurrencia, auditoría y políticas de almacenamiento.
- El usuario debe poder reportar bloqueos técnicos y cambios de alcance separados del reproceso interno; el esquema ya conserva motivo y nota, pero necesita clasificación analítica.
- Seguridad: probar exhaustivamente RLS, controlar las invitaciones y no usar la antigua clave estática como autenticación de escritura.
- Carga de datos inicial: las actividades del cronograma antiguo están protegidas en formatos independientes y aún no se han importado a estas tablas.

El archivo SQL contiene controles iniciales de integridad, pero **no es una auditoría de seguridad**. No publicar esta nueva URL para uso real hasta haber verificado el comportamiento de permisos y terminado la configuración.
