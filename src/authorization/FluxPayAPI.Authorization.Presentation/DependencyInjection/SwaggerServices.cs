using System.Reflection;
using Microsoft.OpenApi;

namespace FluxPayAPI.Authorization.Presentation.DependencyInjection;

public static class SwaggerServices
{
    public static IServiceCollection ConfigureSwagger(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSwaggerGen(c =>
        {
            var version = typeof(SwaggerServices).Assembly
                .GetCustomAttributes<AssemblyMetadataAttribute>()
                .FirstOrDefault(attribute => attribute.Key == "FluxPayBuildVersion")?.Value ?? "dev";

            c.EnableAnnotations();

            c.SwaggerDoc("v1",
                new OpenApiInfo { Title = "FluxPay Authorization API", Version = version });
        });

        return serviceCollection;
    }
}
