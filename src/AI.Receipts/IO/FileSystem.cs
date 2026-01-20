namespace AI.Receipts.IO;

public interface IFileSystem
{
    Task<string> SaveAsync(string fileName, byte[] fileBytes, CancellationToken cancellationToken = default);
    Task<byte[]> Download(string filename);
}

public class FileSystem : IFileSystem
{
    private readonly string _uploadPath;
    private readonly ILogger<FileSystem> _logger;

    public FileSystem(IConfiguration configuration, ILogger<FileSystem> logger)
    {
        _uploadPath = configuration["FileStorage:UploadPath"] ?? "/app/uploads";
        _logger = logger;

        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
            _logger.LogInformation("Created upload directory at {Path}", _uploadPath);
        }
    }

    public async Task<string> SaveAsync(string fileName, byte[] fileBytes, CancellationToken cancellationToken = default)
    {
        var safeFileName = Path.GetFileNameWithoutExtension(fileName);
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{safeFileName}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(_uploadPath, uniqueFileName);

        try
        {
            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes, cancellationToken);
            _logger.LogInformation("Saved file to {Path}, size: {Size} bytes", filePath, fileBytes.Length);
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save file {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> Download(string filename)
    {
        var memoryStream = new MemoryStream();

        using var stream = new FileStream(filename, FileMode.Open);
        await stream.CopyToAsync(memoryStream);

        memoryStream.Position = 0;
        return memoryStream.ToArray();
    }
}
