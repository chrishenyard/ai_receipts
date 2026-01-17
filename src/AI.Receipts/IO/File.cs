namespace AI.Receipts.IO;

public static class File
{
    public static readonly string[] SupportedImageTypes =
    [
        "image/jpeg",
        "image/png",
        "image/bmp",
        "image/gif",
        "image/tiff",
        "image/webp"
    ];

    public static string ReadTextFromFile(string filePath)
    {
        return System.IO.File.ReadAllText(filePath);
    }
}
