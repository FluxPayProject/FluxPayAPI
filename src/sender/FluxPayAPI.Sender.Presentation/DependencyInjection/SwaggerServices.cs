using System.Reflection;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi;

namespace FluxPayAPI.Sender.Presentation.DependencyInjection;

public static class SwaggerServices
{
    public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSwaggerGen(c =>
        {
            var version = typeof(SwaggerServices).Assembly
                .GetCustomAttributes<AssemblyMetadataAttribute>()
                .FirstOrDefault(attribute => attribute.Key == "FluxPayBuildVersion")?.Value ?? "dev";
            
            c.EnableAnnotations();

            c.SwaggerDoc("v1",
                new OpenApiInfo { Title = "FluxPay Sender API", Version = version });
            
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

            //c.AddSecurityRequirement(
            //    new OpenApiSecurityRequirement
            //    {
            //        {
            //            new OpenApiSecurityScheme
            //            {
            //                Reference = new OpenApiReference
            //                {
            //                    Type = ReferenceType.SecurityScheme,
            //                    Id = "token"
            //                },
            //            },
            //            Array.Empty<string>()
            //        }
            //    }
            //);
        });

        return serviceCollection;
    }
}
