using System.ComponentModel.DataAnnotations;

namespace AI.Receipts.Settings;

public class FileStorage
{
    public const string SectionName = "FileStorage";

    [Required]
    public string UploadPath { get; set; } = null!;

    [Range(1, 10 * 1024 * 1024)]
    public int MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10 MB
}
