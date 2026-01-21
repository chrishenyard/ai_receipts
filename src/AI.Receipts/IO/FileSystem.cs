using AI.Receipts.Settings;
using Microsoft.Extensions.Options;

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
    private readonly FileStorage _fileStorage;

    public FileSystem(IOptions<FileStorage> fileStorageOptions, ILogger<FileSystem> logger)
    {
        _fileStorage = fileStorageOptions.Value;
        _uploadPath = _fileStorage.UploadPath;
        _logger = logger;
    }

    private void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
        {
            try
            {
                Directory.CreateDirectory(path);
                _logger.LogInformation("Created directory at {Path}", path);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create directory at {Path}", path);
                throw;
            }
        }
    }

    public async Task<string> SaveAsync(string fileName, byte[] fileBytes, CancellationToken cancellationToken = default)
    {
        var currentPath = $"{DateTime.Now.Year}{DateTime.Now.Month:00}{DateTime.Now.Day:00}";
        var fullDirectoryPath = Path.Combine(_uploadPath, currentPath);

        EnsureDirectoryExists(fullDirectoryPath);

        var safeFileName = Path.GetFileNameWithoutExtension(fileName);
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{safeFileName}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(fullDirectoryPath, uniqueFileName);

        try
        {
            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes, cancellationToken);
            _logger.LogInformation("Saved file to {Path}, size: {Size} bytes", filePath, fileBytes.Length);
            return Path.Combine(currentPath, uniqueFileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save file {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> Download(string filename)
    {
        var filePath = Path.Combine(_uploadPath, filename);

        if (!System.IO.File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {filename}");
        }

        return await System.IO.File.ReadAllBytesAsync(filePath);
    }
}
