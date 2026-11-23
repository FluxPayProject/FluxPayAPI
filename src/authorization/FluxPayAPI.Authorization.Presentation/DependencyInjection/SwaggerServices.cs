using Microsoft.OpenApi;

namespace FluxPayAPI.Authorization.Presentation.DependencyInjection;

public static class SwaggerServices
{
    public static IServiceCollection ConfigureSwagger(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSwaggerGen(c =>
        {
            var version = Environment.GetEnvironmentVariable("FLUXPAY_BUILD_VERSION");

            c.EnableAnnotations();

            c.SwaggerDoc("v1",
                new OpenApiInfo { Title = "FluxPay Authorization API", Version = string.IsNullOrWhiteSpace(version) ? "dev" : version });
        });

        return serviceCollection;
    }
}
