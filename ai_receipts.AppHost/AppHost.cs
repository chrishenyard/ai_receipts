var builder = DistributedApplication.CreateBuilder(args);

var ollama = builder.AddOllama("ollama", 11445)
    .WithDataVolume("ollama")
    .WithAnnotation(new ContainerImageAnnotation
    {
        Image = "ollama/ollama",
        Tag = "0.14.0-rc2"
    });

var visionModel = ollama.AddModel("redhat/granite-3-2b-instruct");

builder.AddProject<Projects.ai_receipts>("ai-receipts")
    .WithReference(visionModel)
    .WaitFor(visionModel);

builder.Build().Run();
