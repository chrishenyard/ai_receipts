namespace AI.Receipts.Utils;

public static class Strings
{
    public static string Truncate(this string str, int maxLength)
    {
        if (str == null)
        {
            return string.Empty;
        }

        if (maxLength < 0)
        {
            throw new ArgumentException("Maximum length must be non-negative.", nameof(maxLength));
        }

        return str.Length <= maxLength ? str : str[..maxLength];
    }
}
