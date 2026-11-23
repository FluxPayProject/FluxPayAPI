using Microsoft.Extensions.DependencyInjection;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi;

namespace FluxPayAPI.Shared.Application.Extensions;

public static class SwaggerServices
{
    public static IServiceCollection AddFluxPaySwagger(this IServiceCollection serviceCollection, string title)
    {
        serviceCollection.AddSwaggerGen(c =>
        {
            var version = Environment.GetEnvironmentVariable("FLUXPAY_BUILD_VERSION");

            c.EnableAnnotations();

            c.SwaggerDoc("v1",
                new OpenApiInfo { Title = title, Version = string.IsNullOrWhiteSpace(version) ? "dev" : version });

            c.AddSecurityDefinition(
                "token",
                new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    BearerFormat = "JWT",
                    Scheme = "Bearer",
                    In = ParameterLocation.Header,
                    Name = HeaderNames.Authorization
                }
            );
        });

        return serviceCollection;
    }
}
