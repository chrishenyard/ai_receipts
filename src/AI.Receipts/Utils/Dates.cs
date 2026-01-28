namespace AI.Receipts.Utils;

public static class Dates
{
    public static DateTime TryDate(string dateString)
    {
        if (DateTime.TryParse(dateString, out DateTime parsedDate))
        {
            return parsedDate;
        }
        return DateTime.Now;
    }
}
