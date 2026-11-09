namespace SchoolAdmission.Domain.Entities;

public class AdmissionClass
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<AdmissionHold> Holds { get; set; } = new List<AdmissionHold>();
}

