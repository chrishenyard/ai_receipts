using AI.Receipts.Configuration;
using AI.Receipts.Data;
using AI.Receipts.IO;
using AI.Receipts.Services;
using AI.Receipts.Settings;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace AI.Receipts.Configuration;

public static class ServiceExtensions
{
    public static IServiceCollection AddSettings(this IServiceCollection services)
    {
        services
           .AddOptions<OllamaSettings>()
           .BindConfiguration(OllamaSettings.SectionName)
           .ValidateDataAnnotations()
           .ValidateOnStart();

        services
           .AddOptions<FileStorage>()
           .BindConfiguration(FileStorage.SectionName)
           .ValidateDataAnnotations()
           .ValidateOnStart();

        return services;
    }

    public static IServiceCollection AddDbContext(
        this IServiceCollection services,
        IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DatabaseContext");
        services
            .AddDbContext<AiReceiptsDbContext>(options =>
            {
                options.UseSqlite(connectionString);
            });

        return services;
    }

    public static IServiceCollection AddHttp(
        this IServiceCollection services,
        IConfiguration config)
    {
        var ollamaSettings = config
            .GetSection(OllamaSettings.SectionName)
            .Get<OllamaSettings>()!;

        services
            .AddHttpClient<IOllamaClientFactory, OllamaClientFactory>("ollama", (httpClient) =>
            {
                httpClient.BaseAddress = new Uri(ollamaSettings.Url);
                httpClient.Timeout = TimeSpan.FromMinutes(ollamaSettings.TimeoutFromMinutes);
            })
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            });

        return services;
    }

    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IOllamaClientFactory, OllamaClientFactory>();
        services.AddScoped(sp =>
        {
            var factory = sp.GetRequiredService<IOllamaClientFactory>();
            return factory.CreateClient();
        });

        services.AddHostedService<OllamaModelInitializer>()
                .AddScoped<IFileSystem, FileSystem>()
                .AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo("/app/DataProtectionKeys/"))
                .SetApplicationName("AI.Receipts");

        return services;
    }

    public static IServiceCollection AddTelemetry(
    this IServiceCollection services,
    IConfiguration config)
    {
        var seqSettings = config.GetSection("SeqSettings")
            .Get<SeqSettings>()!;

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService("AI.Receipts")
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
                }))
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = true;
                })
                .AddEntityFrameworkCoreInstrumentation(options =>
                {
                    options.EnrichWithIDbCommand = (activity, command) =>
                    {
                        activity.SetTag("db.statement", command.CommandText);
                    };
                })
                .AddHttpClientInstrumentation(options =>
                {
                    options.RecordException = true;
                    options.FilterHttpRequestMessage = (httpRequestMessage) =>
                    {
                        // Ensure Ollama requests are captured
                        return true;
                    };
                })
                .AddSource("OllamaSharp")
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }))
            .WithLogging(logging => logging
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }));

        return services;
    }

    public static WebApplicationBuilder AddConfiguration(this WebApplicationBuilder builder)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(builder.Environment.ContentRootPath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        builder.Configuration.AddConfiguration(configuration);

        return builder;
    }
}
