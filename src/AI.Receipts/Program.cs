using AI.Receipts.Configuration;
using AI.Receipts.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseKestrel(builder =>
{
    builder.AddServerHeader = false;
});

builder.Host
    .UseDefaultServiceProvider((context, options) =>
    {
        options.ValidateOnBuild = true;
    });

builder
    .AddConfiguration();

var configuration = builder.Configuration;

builder.Services
    .AddOpenApi()
    .AddTelemetry(configuration)
    .AddProblemDetails()
    .AddSettings()
    .AddHttp(configuration)
    .AddServices()
    .AddDbContext(configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
    });
}

app.UseHttpsRedirection();

EndPoints.Map(app);
app.Run();
